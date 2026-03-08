CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sell_price` real NOT NULL,
	`cost_price` real NOT NULL,
	`current_stock` integer DEFAULT 0 NOT NULL,
	`low_stock_threshold` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `sales_periods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sales_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sales_period_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity_sold` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`sales_period_id`) REFERENCES `sales_periods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`quantity_delta` integer NOT NULL,
	`type` text NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
