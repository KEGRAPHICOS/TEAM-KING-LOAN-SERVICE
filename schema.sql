CREATE TABLE IF NOT EXISTS loan_applications (
    id BIGSERIAL PRIMARY KEY,

    application_number VARCHAR(40) UNIQUE NOT NULL,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,

    momo_phone VARCHAR(30) NOT NULL,
    momo_network VARCHAR(50) NOT NULL,

    loan_amount NUMERIC(12,2) NOT NULL CHECK (loan_amount > 0),
    loan_type VARCHAR(50) NOT NULL,

    interest_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    interest_amount NUMERIC(12,2) NOT NULL,
    total_payable NUMERIC(12,2) NOT NULL,

    guarantor_name VARCHAR(200) NOT NULL,
    guarantor_phone VARCHAR(30) NOT NULL,
    guarantor_address TEXT NOT NULL,
    guarantor_relationship VARCHAR(100) NOT NULL,

    ghana_card_front_path TEXT,
    ghana_card_back_path TEXT,
    pdf_path TEXT,

    email_sent BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_applications_created_at
ON loan_applications(created_at DESC);