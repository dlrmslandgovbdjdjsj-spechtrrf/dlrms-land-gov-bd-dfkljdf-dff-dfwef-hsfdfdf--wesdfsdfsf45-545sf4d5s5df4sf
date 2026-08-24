LAND RECORD - GITHUB + SUPABASE PACKAGE
========================================

Supabase connection has already been filled in config.js.

Before publishing:
1. Make sure the database.sql was run in your Supabase SQL Editor.
2. Make sure the admin user email is: dlrms.land.gov.bd.jdjsj@gmail.com
3. Upload ALL files in this folder to your GitHub repository.
4. Enable GitHub Pages from Settings > Pages, Deploy from branch > main > /root.
5. Open your GitHub Pages URL.
6. Open /admin.html to use the Admin Panel.

Admin login:
Email: dlrms.land.gov.bd.jdjsj@gmail.com
Password: the password you created in Supabase Authentication > Users.

Important security note:
- The file uses the Supabase publishable key, which is intended for browser apps.
- NEVER place a Supabase secret/service_role key in config.js or GitHub.
- Row Level Security (RLS) must remain enabled on public.land_records.

Main page: index.html
Admin page: admin.html
