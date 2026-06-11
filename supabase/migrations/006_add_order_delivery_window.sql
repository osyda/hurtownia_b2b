alter table public.orders
  add column if not exists delivery_window text;

comment on column public.orders.delivery_window is 'Preferred delivery time window selected by the customer, e.g. 11:00-15:00.';
