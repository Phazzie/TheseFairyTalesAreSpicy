-- Atomic generation slot reservation
-- Returns TRUE if slot reserved (count incremented), FALSE if limit already reached.
-- Must be called BEFORE the Grok API call. If the Grok call fails, call refund_generation_slot to refund.
CREATE OR REPLACE FUNCTION public.try_reserve_generation_slot(
  p_user_id UUID,
  p_limit INT
) RETURNS BOOLEAN
LANGUAGE plpgsql AS $$
DECLARE
  rows_updated INT;
BEGIN
  UPDATE public.profiles
    SET monthly_generation_count = monthly_generation_count + 1
  WHERE id = p_user_id
    AND (p_limit = -1 OR monthly_generation_count < p_limit);
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;

-- Refund a slot (called if generation fails after reservation)
CREATE OR REPLACE FUNCTION public.refund_generation_slot(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.profiles
    SET monthly_generation_count = GREATEST(0, monthly_generation_count - 1)
  WHERE id = p_user_id;
END;
$$;
