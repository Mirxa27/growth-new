create or replace function public.insert_assessment_result(
  user_id uuid,
  assessment_id text,
  score integer,
  max_score integer,
  answers jsonb
)
returns table (
  id uuid,
  created_at timestamptz
)
language plpgsql
security definer
as $$
begin
  return query
  insert into assessment_results (user_id, assessment_id, score, max_score, answers)
  values (user_id, assessment_id, score, max_score, answers)
  returning id, created_at;
end;
$$;
