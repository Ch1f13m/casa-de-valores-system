-- Casa de Valores Database Initialization Script

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS casa_valores;
USE casa_valores;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('admin', 'broker', 'investor', 'compliance_officer', 'risk_manager') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- User permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(36),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_permission (user_id, permission)
);

-- Securities table
CREATE TABLE IF NOT EXISTS securities (
    id VARCHAR(36) PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    security_type ENUM('stock', 'bond', 'etf', 'mutual_fund', 'option', 'future') NOT NULL,
    exchange VARCHAR(10) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    sector VARCHAR(50),
    industry VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_symbol (symbol),
    INDEX idx_security_type (security_type),
    INDEX idx_exchange (exchange)
);

-- Portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    total_value DECIMAL(15,2) DEFAULT 0.00,
    cash_balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Holdings table
CREATE TABLE IF NOT EXISTS holdings (
    id VARCHAR(36) PRIMARY KEY,
    portfolio_id VARCHAR(36) NOT NULL,
    security_id VARCHAR(36) NOT NULL,
    quantity DECIMAL(15,6) NOT NULL,
    average_cost DECIMAL(10,4) NOT NULL,
    current_price DECIMAL(10,4) DEFAULT 0.0000,
    market_value DECIMAL(15,2) GENERATED ALWAYS AS (quantity * current_price) STORED,
    unrealized_pnl DECIMAL(15,2) GENERATED ALWAYS AS ((current_price - average_cost) * quantity) STORED,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    FOREIGN KEY (security_id) REFERENCES securities(id) ON DELETE CASCADE,
    UNIQUE KEY unique_portfolio_security (portfolio_id, security_id),
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_security_id (security_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    portfolio_id VARCHAR(36) NOT NULL,
    security_id VARCHAR(36) NOT NULL,
    order_type ENUM('market', 'limit', 'stop', 'stop_limit') NOT NULL,
    side ENUM('buy', 'sell') NOT NULL,
    quantity DECIMAL(15,6) NOT NULL,
    price DECIMAL(10,4),
    stop_price DECIMAL(10,4),
    status ENUM('pending', 'partial', 'filled', 'cancelled', 'rejected') DEFAULT 'pending',
    filled_quantity DECIMAL(15,6) DEFAULT 0,
    average_fill_price DECIMAL(10,4) DEFAULT 0,
    commission DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    FOREIGN KEY (security_id) REFERENCES securities(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_security_id (security_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    security_id VARCHAR(36) NOT NULL,
    side ENUM('buy', 'sell') NOT NULL,
    quantity DECIMAL(15,6) NOT NULL,
    price DECIMAL(10,4) NOT NULL,
    commission DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * price + commission) STORED,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settlement_date DATE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (security_id) REFERENCES securities(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_security_id (security_id),
    INDEX idx_executed_at (executed_at)
);

-- Risk limits table
CREATE TABLE IF NOT EXISTS risk_limits (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    portfolio_id VARCHAR(36),
    limit_type ENUM('position_limit', 'loss_limit', 'exposure_limit', 'concentration_limit') NOT NULL,
    limit_value DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_limit_type (limit_type)
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity_type (entity_type),
    INDEX idx_created_at (created_at)
);

-- Insert sample data
INSERT INTO users (id, username, email, password_hash, first_name, last_name, role) VALUES
('admin-001', 'admin', 'admin@casavalores.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZp/k/K', 'System', 'Administrator', 'admin'),
('broker-001', 'broker1', 'broker1@casavalores.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZp/k/K', 'John', 'Broker', 'broker'),
('investor-001', 'investor1', 'investor1@casavalores.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZp/k/K', 'Jane', 'Investor', 'investor');

INSERT INTO securities (id, symbol, name, security_type, exchange, sector) VALUES
('sec-001', 'AAPL', 'Apple Inc.', 'stock', 'NASDAQ', 'Technology'),
('sec-002', 'GOOGL', 'Alphabet Inc.', 'stock', 'NASDAQ', 'Technology'),
('sec-003', 'MSFT', 'Microsoft Corporation', 'stock', 'NASDAQ', 'Technology'),
('sec-004', 'TSLA', 'Tesla Inc.', 'stock', 'NASDAQ', 'Automotive'),
('sec-005', 'SPY', 'SPDR S&P 500 ETF Trust', 'etf', 'NYSE', 'Index Fund');

INSERT INTO portfolios (id, user_id, name, cash_balance) VALUES
('port-001', 'investor-001', 'Main Portfolio', 10000.00),
('port-002', 'broker-001', 'Broker Portfolio', 50000.00);