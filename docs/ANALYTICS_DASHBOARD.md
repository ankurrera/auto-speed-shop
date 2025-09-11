# Analytics Dashboard

The Analytics Dashboard provides comprehensive insights into the Auto Speed Shop's performance and customer behavior.

## Features

### KPI Cards
- **Total Sales**: Sum of all confirmed order amounts with month-over-month comparison
- **Total Revenue**: Sum of convenience fees and delivery charges with trend indicators
- **Total Orders**: Count of confirmed orders with percentage change
- **New Users**: New customer registrations this month with growth metrics

### Interactive Charts
- **Sales Over Time**: Line chart showing sales trends with configurable periods (7, 30, 90 days)
- **Customer Locations**: Donut chart showing geographical distribution of customers

### Data Tables
- **Best Selling Products**: Top products by sales volume in the last 30 days
- **Recent Orders**: Latest order activities with customer information

## Access Control

The analytics dashboard is restricted to admin users only. Users must:
1. Be logged in with a valid session
2. Have admin privileges (`is_admin = true` in profiles table)

## Backend Functions

The dashboard uses several PostgreSQL RPC functions for data retrieval:

### `get_analytics_kpis(requesting_user_id)`
Returns KPI metrics including sales, revenue, orders, and percentage changes.

### `get_analytics_sales_chart(requesting_user_id, days_back)`
Provides sales data over time for charting with configurable time periods.

### `get_analytics_best_products(requesting_user_id, limit_count)`
Returns top-selling products by revenue with quantity and pricing metrics.

### `get_analytics_recent_orders(requesting_user_id, limit_count)`
Fetches recent orders with customer information and locations.

### `get_analytics_users(requesting_user_id)`
Provides user analytics including new user counts and location distribution.

## Security

All RPC functions include admin privilege validation:
- Functions check `is_admin = true` for the requesting user
- Unauthorized access throws an exception
- All functions use `SECURITY DEFINER` for controlled access

## Usage

### Accessing the Dashboard
- Navigate to `/analytics` (requires admin login)
- Available from the user menu dropdown for admin users
- Also accessible via Account page for admin users

### Period Filtering
Use the period selector to view sales data for different time ranges:
- Last 7 Days
- Last 30 Days (default)
- Last 90 Days

## Database Requirements

The analytics functions require the following tables:
- `orders` - Order data with status and amounts
- `order_items` - Individual product/part items
- `profiles` - User information and admin flags
- `addresses` - Customer location data

## Performance Considerations

- Functions filter by order status (`confirmed` only) for accurate metrics
- Indexed queries on `created_at` and `user_id` fields
- Limited result sets with configurable limits
- Efficient aggregation queries for KPI calculations