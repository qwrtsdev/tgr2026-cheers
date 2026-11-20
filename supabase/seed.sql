-- Dummy cards for testing. Fixed ids (00000000-0000-4000-8000-00000000000X) so they are easy to remove:
--   delete from auth.users where id::text like '00000000-0000-4000-8000-%';
-- (cascades to profiles and cheers)

insert into auth.users (id, aud, role, is_anonymous, created_at, updated_at)
select ('00000000-0000-4000-8000-00000000000' || i)::uuid, 'authenticated', 'authenticated', true, now(), now()
from generate_series(1, 5) as i
on conflict (id) do nothing;

insert into public.profiles (id, display_name, description, tgr_team_number, facebook_url, instagram_url, discord_username, github_url)
values
  ('00000000-0000-4000-8000-000000000001', 'มิ้นท์', 'ชอบกาแฟดริป เล่นบอร์ดเกมทุกเสาร์ หาเพื่อนไปคาเฟ่', 12,
   null, 'https://instagram.com/mint.example', 'mint.cafe', null),
  ('00000000-0000-4000-8000-000000000002', 'บอส', 'สาย backend ชอบ Go กับ Postgres ทักมาคุยเรื่องระบบได้', 3,
   null, null, 'boss_dev', 'https://github.com/boss-example'),
  ('00000000-0000-4000-8000-000000000003', 'ฟ้า', 'วาดรูป ทำ UI เล่นแมว', null,
   'https://facebook.com/fah.example', 'https://instagram.com/fah.draws', null, null),
  ('00000000-0000-4000-8000-000000000004', 'Ken', 'From Chiang Mai. Into hardware, drones and spicy food.', 56,
   null, null, 'ken.drone', 'https://github.com/ken-example'),
  ('00000000-0000-4000-8000-000000000005', 'แพรวพราวแสงอรุณรุ่งโรจน์', 'ชื่อยาวไว้ทดสอบการตัดบรรทัด ไม่มีช่องทางติดต่อ', 1,
   null, null, null, null)
on conflict (id) do nothing;

-- A few cheers so the leaderboard has data (from -> to).
insert into public.cheers (from_user, to_profile)
values
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003'),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000003'),
  ('00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000004')
on conflict do nothing;
