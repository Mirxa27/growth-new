# Terraform Configuration for Newomen.me Infrastructure
# AWS + Supabase Production Setup

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 0.2"
    }
  }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "newomen"
      ManagedBy   = "terraform"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "newomen"
}

variable "supabase_project_id" {
  description = "Supabase project ID"
  type        = string
  sensitive   = true
}

variable "supabase_access_token" {
  description = "Supabase access token"
  type        = string
  sensitive   = true
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Configuration
module "vpc" {
  source = "./modules/vpc"
  
  project_name = var.project_name
  environment  = var.environment
  azs          = data.aws_availability_zones.available.names
}

# S3 Buckets for Backups
resource "aws_s3_bucket" "backups" {
  bucket = "${var.project_name}-${var.environment}-backups-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "backup-lifecycle"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/${var.environment}/newomen/application"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "database" {
  name              = "/aws/${var.environment}/newomen/database"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "edge_functions" {
  name              = "/aws/${var.environment}/newomen/edge-functions"
  retention_in_days = 14
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions     = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "database_storage" {
  alarm_name          = "${var.project_name}-${var.environment}-database-storage"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "450"
  alarm_description   = "This metric monitors RDS database connections"
  alarm_actions     = [aws_sns_topic.alerts.arn]
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "devops@newomen.me"
}

# Secrets Manager for API Keys
resource "aws_secretsmanager_secret" "supabase_keys" {
  name        = "${var.project_name}/${var.environment}/supabase"
  description = "Supabase configuration keys"
}

resource "aws_secretsmanager_secret_version" "supabase_keys" {
  secret_id = aws_secretsmanager_secret.supabase_keys.id
  secret_string = jsonencode({
    project_id       = var.supabase_project_id
    access_token     = var.supabase_access_token
    jwt_secret       = random_password.jwt_secret.result
    anon_key        = random_password.anon_key.result
    service_role_key = random_password.service_role_key.result
  })
}

# Generate secure passwords
resource "random_password" "jwt_secret" {
  length           = 64
  special          = true
  override_special = "!@#$%^&*"
}

resource "random_password" "anon_key" {
  length  = 40
  special = false
}

resource "random_password" "service_role_key" {
  length  = 40
  special = false
}

# Outputs
output "backup_bucket" {
  value = aws_s3_bucket.backups.bucket
}

output "log_groups" {
  value = {
    application = aws_cloudwatch_log_group.application.name
    database    = aws_cloudwatch_log_group.database.name
    edge_functions = aws_cloudwatch_log_group.edge_functions.name
  }
}

output "secrets_manager_arn" {
  value = aws_secretsmanager_secret.supabase_keys.arn
}