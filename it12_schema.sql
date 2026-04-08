CREATE TABLE public.discounts (
  discount_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type = ANY (ARRAY['percentage'::text, 'fixed'::text])),
  value numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT discounts_pkey PRIMARY KEY (discount_id)
);
CREATE TABLE public.inventory (
  inventory_id uuid NOT NULL DEFAULT gen_random_uuid(),
  inventory_code text,
  item_name text NOT NULL,
  unit_id uuid,
  quantity_in_stock numeric DEFAULT 0,
  reorder_level numeric DEFAULT 10,
  unit_cost numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  inventory_seq bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  previous_unit_cost numeric DEFAULT 0,
  is_deleted boolean DEFAULT false,
  inventory_category_id uuid NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  CONSTRAINT inventory_pkey PRIMARY KEY (inventory_id),
  CONSTRAINT inventory_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(unit_id),
  CONSTRAINT inventory_inventory_category_id_fkey FOREIGN KEY (inventory_category_id) REFERENCES public.inventory_categories(id)
);
CREATE TABLE public.inventory_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inventory_transaction (
  transaction_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  transaction_type text NOT NULL,
  reference_id text,
  remarks text,
  transaction_date timestamp with time zone DEFAULT now(),
  transaction_seq bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  transaction_code text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_transaction_pkey PRIMARY KEY (transaction_id),
  CONSTRAINT inventory_transaction_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users_profile(id)
);
CREATE TABLE public.inventory_transaction_details (
  detail_id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid,
  inventory_id uuid NOT NULL,
  quantity_change numeric NOT NULL,
  unit_id uuid,
  cost_per_unit numeric,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_transaction_details_pkey PRIMARY KEY (detail_id),
  CONSTRAINT inventory_transaction_details_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.inventory_transaction(transaction_id),
  CONSTRAINT inventory_transaction_details_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(inventory_id),
  CONSTRAINT inventory_transaction_details_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(unit_id)
);
CREATE TABLE public.order_items (
  order_item_id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  variant_id uuid,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  subtotal numeric NOT NULL,
  service_offer_id uuid,
  fulfillment_type text DEFAULT 'dine_in'::text,
  CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id),
  CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(variant_id)
);
CREATE TABLE public.order_status_log (
  log_id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  user_id uuid,
  old_status text,
  new_status text,
  timestamp timestamp with time zone DEFAULT now(),
  reason text,
  CONSTRAINT order_status_log_pkey PRIMARY KEY (log_id),
  CONSTRAINT order_status_log_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id),
  CONSTRAINT order_status_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users_profile(id)
);
CREATE TABLE public.orders (
  order_id uuid NOT NULL DEFAULT gen_random_uuid(),
  receipt_number bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  order_date timestamp with time zone DEFAULT now(),
  total_amount numeric NOT NULL,
  amount_received numeric DEFAULT 0,
  change numeric DEFAULT 0,
  payment_method text,
  payment_reference text UNIQUE,
  order_source text DEFAULT 'in_store'::text,
  third_party_order_id text UNIQUE,
  current_status text DEFAULT 'completed'::text,
  updated_at timestamp with time zone,
  updated_by uuid,
  discount_id uuid,
  discount_amount numeric DEFAULT 0,
  subtotal_amount numeric DEFAULT 0,
  customer_name text,
  CONSTRAINT orders_pkey PRIMARY KEY (order_id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users_profile(id),
  CONSTRAINT orders_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users_profile(id),
  CONSTRAINT orders_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discounts(discount_id)
);
CREATE TABLE public.product_bundles (
  bundle_id uuid NOT NULL DEFAULT gen_random_uuid(),
  parent_variant_id uuid,
  child_variant_id uuid,
  quantity integer NOT NULL DEFAULT 1,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_bundles_pkey PRIMARY KEY (bundle_id),
  CONSTRAINT product_bundles_parent_variant_id_fkey FOREIGN KEY (parent_variant_id) REFERENCES public.product_variants(variant_id),
  CONSTRAINT product_bundles_child_variant_id_fkey FOREIGN KEY (child_variant_id) REFERENCES public.product_variants(variant_id)
);
CREATE TABLE public.product_categories (
  product_category_id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_code text,
  category_name text NOT NULL,
  category_description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_categories_pkey PRIMARY KEY (product_category_id)
);
CREATE TABLE public.product_inventory (
  product_inventory_id uuid NOT NULL DEFAULT gen_random_uuid(),
  variant_id uuid,
  inventory_id uuid NOT NULL,
  quantity_required numeric NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_inventory_pkey PRIMARY KEY (product_inventory_id),
  CONSTRAINT product_inventory_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(variant_id),
  CONSTRAINT product_inventory_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(inventory_id)
);
CREATE TABLE public.product_variants (
  variant_id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  variant_name text NOT NULL,
  sku text,
  price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT product_variants_pkey PRIMARY KEY (variant_id),
  CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id)
);
CREATE TABLE public.products (
  product_id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  category_id uuid,
  description text,
  status text DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  is_bundle boolean DEFAULT false,
  photo_url text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (product_id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_categories(product_category_id)
);
CREATE TABLE public.system_activity_log (
  log_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action_type text NOT NULL,
  details jsonb,
  timestamp timestamp with time zone DEFAULT now(),
  module text,
  CONSTRAINT system_activity_log_pkey PRIMARY KEY (log_id),
  CONSTRAINT system_activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users_profile(id)
);
CREATE TABLE public.units (
  unit_id uuid NOT NULL DEFAULT gen_random_uuid(),
  unit_name text NOT NULL,
  unit_symbol text NOT NULL,
  CONSTRAINT units_pkey PRIMARY KEY (unit_id)
);
CREATE TABLE public.users_profile (
  id uuid NOT NULL,
  first_name text,
  last_name text,
  contact text UNIQUE,
  role text NOT NULL DEFAULT 'cashier'::text,
  email text,
  account_status text NOT NULL DEFAULT 'active'::text,
  employee_seq bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  pin_code text,
  photo_url text,
  CONSTRAINT users_profile_pkey PRIMARY KEY (id),
  CONSTRAINT users_profile_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);