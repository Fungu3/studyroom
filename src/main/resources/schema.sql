CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    avatar VARCHAR(255),
    coins INT DEFAULT 0,
    room_id BIGINT,
    created_at TIMESTAMP NOT NULL,
    total_study_time_minutes BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS room (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    online_users INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS note_share (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    image_url TEXT,
    user_id BIGINT,
    room_id BIGINT,
    create_time TIMESTAMP,
    collect_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS note_collect (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    note_id BIGINT,
    user_id BIGINT,
    create_time TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    note_id BIGINT,
    user_id BIGINT,
    content TEXT,
    reply_to BIGINT,
    create_time TIMESTAMP,
    like_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS personal_note (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    image_url TEXT,
    user_id BIGINT,
    is_shared BOOLEAN DEFAULT FALSE,
    create_time TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coin_transactions (
	id BIGINT AUTO_INCREMENT PRIMARY KEY,
	room_id BIGINT NOT NULL,
	user_id BIGINT,
	delta INT NOT NULL,
	reason VARCHAR(255) NOT NULL,
	created_at TIMESTAMP NOT NULL
);

