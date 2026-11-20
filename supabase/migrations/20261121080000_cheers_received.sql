-- Let card owners see who cheered them (for the "who cheered me" popup).
create policy "Users can see cheers they received"
on public.cheers for select
to authenticated
using ((select auth.uid()) = to_profile);
