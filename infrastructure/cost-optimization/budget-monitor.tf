# Cost Optimization Configuration
# AWS Budgets and Cost Monitoring for Newomen.me

resource "aws_budgets_budget" "monthly_budget" {
  name              = "newomen-monthly-budget"
  budget_type       = "COST"
  limit_amount      = "500"
  limit_unit        = "USD"
  time_unit         = "MONTHLY"

  cost_types {
    include_credit             = true
    include_discount            = true
    include_other_subscription  = true
    include_recurring           = true
    include_refund              = true
    include_subscription        = true
    include_support            = true
    include_tax                = true
    include_upfront            = true
    use_blended                = false
    use_amortized              = false
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                    = 80
    threshold_type               = "PERCENTAGE"
    notification_type            = "ACTUAL"
    subscriber_email_addresses   = ["finance@newomen.me", "devops@newomen.me"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                    = 100
    threshold_type               = "PERCENTAGE"
    notification_type            = "FORECASTED"
    subscriber_email_addresses   = ["finance@newomen.me", "devops@newomen.me"]
  }
}

resource "aws_budgets_budget" "supabase_budget" {
  name              = "newomen-supabase-budget"
  budget_type       = "COST"
  limit_amount      = "200"
  limit_unit        = "USD"
  time_unit         = "MONTHLY"

  cost_filter {
    name = "Service"
    values = ["Amazon RDS", "AWS Lambda", "Amazon S3", "Amazon CloudWatch"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                    = 75
    threshold_type               = "PERCENTAGE"
    notification_type            = "ACTUAL"
    subscriber_email_addresses   = ["finance@newomen.me"]
  }
}

# Cost Explorer Anomaly Detection
resource "aws_ce_anomaly_monitor" "supabase_anomaly" {
  name              = "newomen-cost-anomaly"
  monitor_type      = "CUSTOM"
  monitor_dimension = "SERVICE"

  anomaly_subscription {
    frequency         = "DAILY"
    monitor_arn_list  = [aws_ce_anomaly_monitor.supabase_anomaly.arn]
    subscribers {
      type    = "EMAIL"
      address = "finance@newomen.me"
    }
  }
}

# Auto-scaling policies for cost optimization
resource "aws_appautoscaling_policy" "supabase_scaling" {
  name               = "newomen-db-scaling"
  service_namespace  = "rds"
  resource_id        = "cluster:newomen-db-cluster"
  scalable_dimension = "rds:cluster:ReadReplicaCount"

  target_tracking_scaling_policy_configuration {
    target_value = 70.0
    
    predefined_metric_specification {
      predefined_metric_type = "RDSReaderAverageCPUUtilization"
    }
    
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

# Resource tagging for cost allocation
resource "aws_default_tags" "cost_allocation" {
  tags = {
    Environment = var.environment
    Project     = var.project_name
    CostCenter  = "newomen-infrastructure"
    Owner       = "devops@newomen.me"
  }
}

# Reserved Instance recommendations
data "aws_pricing_product" "supabase_rds" {
  service_code = "AmazonRDS"
  filters = {
    location      = "US East (N. Virginia)"
    instanceType  = "db.t3.medium"
    databaseEngine = "postgres"
    tenancy        = "Shared"
    operatingSystem = "Linux"
  }
}

# Resource optimization recommendations
resource "null_resource" "optimization_recommendations" {
  provisioner "local-exec" {
    command = <<-EOT
      echo "Generating cost optimization report..."
      aws ce get-rightsizing-recommendation --service AmazonRDS > rds-recommendations.json
      aws ce get-rightsizing-recommendation --service AWSLambda > lambda-recommendations.json
    EOT
  }
}