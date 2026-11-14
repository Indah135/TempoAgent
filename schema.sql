create table if not exists schedules (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    schedule_date date not null,
    start_time time not null,
    end_time time not null,
    status text not null default 'scheduled',
    created_at timestamptz not null default now()
);

create index if not exists idx_schedules_schedule_date
    on schedules (schedule_date);
