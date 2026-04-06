-- Ejecutar esto en Supabase > SQL Editor

-- Tabla de ejercicios
create table exercises (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  muscle_group text not null,
  created_at timestamptz default now()
);

-- Tabla de entradas de entrenamiento
create table workout_entries (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date text not null,
  exercise_id bigint references exercises(id) on delete cascade not null,
  series jsonb not null default '[]',
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- Indices
create index idx_exercises_user on exercises(user_id);
create index idx_workout_entries_user on workout_entries(user_id);
create index idx_workout_entries_date on workout_entries(user_id, date);
create index idx_workout_entries_exercise on workout_entries(user_id, exercise_id);

-- RLS (Row Level Security)
alter table exercises enable row level security;
alter table workout_entries enable row level security;

create policy "Users can read own exercises"
  on exercises for select using (auth.uid() = user_id);

create policy "Users can insert own exercises"
  on exercises for insert with check (auth.uid() = user_id);

create policy "Users can update own exercises"
  on exercises for update using (auth.uid() = user_id);

create policy "Users can delete own exercises"
  on exercises for delete using (auth.uid() = user_id);

create policy "Users can read own workouts"
  on workout_entries for select using (auth.uid() = user_id);

create policy "Users can insert own workouts"
  on workout_entries for insert with check (auth.uid() = user_id);

create policy "Users can update own workouts"
  on workout_entries for update using (auth.uid() = user_id);

create policy "Users can delete own workouts"
  on workout_entries for delete using (auth.uid() = user_id);

-- Habilitar Realtime para ambas tablas
alter publication supabase_realtime add table exercises;
alter publication supabase_realtime add table workout_entries;
