const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = 8000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'SAT',
    password: 'Rohith@2006',
    port: 5432,
});

async function initDb() {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to PostgreSQL database: SAT');
        client.release();

        await pool.query(`CREATE TABLE IF NOT EXISTS bookings (
            id SERIAL PRIMARY KEY, booking_date DATE NOT NULL, name VARCHAR(100) NOT NULL,
            phone VARCHAR(20) NOT NULL, email VARCHAR(100), pickup VARCHAR(150) NOT NULL,
            dropoff VARCHAR(150) NOT NULL, trip_type VARCHAR(50) NOT NULL, vehicle VARCHAR(50) NOT NULL,
            passengers INTEGER NOT NULL, special_instructions TEXT, status VARCHAR(30) DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('Bookings table checked/initialized in database.');

        await pool.query(`CREATE TABLE IF NOT EXISTS feedback (
            id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, rating INTEGER NOT NULL,
            critique TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('Feedback table checked/initialized in database.');

        await pool.query(`CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, rating INTEGER NOT NULL,
            role VARCHAR(100) NOT NULL, review TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('Public reviews table checked/initialized in database.');

        await pool.query(`CREATE TABLE IF NOT EXISTS fleet (
            id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, category VARCHAR(50) NOT NULL,
            badge VARCHAR(50) DEFAULT 'Available', seats VARCHAR(30) NOT NULL, description TEXT NOT NULL,
            features TEXT DEFAULT '[]', photos TEXT DEFAULT '[]',
            is_active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('Fleet table checked/initialized in database.');

        await pool.query(`CREATE TABLE IF NOT EXISTS contact_settings (
            id SERIAL PRIMARY KEY, key VARCHAR(50) UNIQUE NOT NULL,
            value TEXT NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('Contact settings table checked/initialized in database.');

        // Seed bookings
        const bc = await pool.query('SELECT COUNT(*) FROM bookings');
        if (parseInt(bc.rows[0].count) === 0) {
            await pool.query(`INSERT INTO bookings (booking_date,name,phone,pickup,dropoff,trip_type,vehicle,passengers,status) VALUES
                ('2026-06-29','Rajesh Kumar','+91 98450 12345','Coimbatore Airport','Ooty (Valley View)','Round Trip','Tempo Traveller',14,'Pending'),
                ('2026-06-28','Suresh Menon','+91 94440 67890','Kochi Town','Coimbatore Junction','One Way','Family Van',6,'Confirmed'),
                ('2026-06-25','Priyanjali Sharma','+91 98110 54321','Chennai Central','Mahabalipuram Resorts','Round Trip','Innova',4,'Completed')`);
            console.log('Seeded database with initial mock bookings.');
        }

        // Seed feedback
        const fc = await pool.query('SELECT COUNT(*) FROM feedback');
        if (parseInt(fc.rows[0].count) === 0) {
            await pool.query(`INSERT INTO feedback (name,rating,critique,created_at) VALUES
                ('Suresh Menon',5,'The driver was extremely punctual and polite. One small suggestion: it would be great if you could provide mineral water bottles inside the car for long outstation journeys.','2026-06-28 10:00:00'),
                ('Rajesh Kumar',4,'The surround audio system in the Tempo Traveller was amazing! However, please double check the charging ports next time; two of the USB ports in the back row were not functioning.','2026-06-24 15:30:00'),
                ('Anand Verma',3,'Route guidance was excellent, but the pickup was delayed by 15 minutes due to heavy bypass traffic. A proactive call from the driver warning us about the delay would have helped us prepare.','2026-06-20 09:15:00')`);
            console.log('Seeded database with initial mock feedback.');
        }

        // Seed reviews
        const rc = await pool.query('SELECT COUNT(*) FROM reviews');
        if (parseInt(rc.rows[0].count) === 0) {
            await pool.query(`INSERT INTO reviews (name,rating,role,review) VALUES
                ('Rajesh Kumar',5,'Family Tour Traveler','We booked the Tempo Traveller for our family tour. The premium surround audio system kept the kids entertained the whole way! The driver''s route guidance was exceptional, avoiding traffic perfectly.'),
                ('Suresh Menon',5,'Private Car Owner','Hired their professional driver service for my BMW for a weekend trip to Ooty. Highly professional driver, very polite, maintained steady speed, and handled mountain hairpin turns gracefully.'),
                ('Priyanjali Sharma',5,'Business Executive','The Innova Crysta was pristine, and the seat comfort was next level. Driver was early and navigated Delhi-Jaipur highway traffic smoothly. Best luxury travel agency around.'),
                ('Vikram Aditya',5,'Group Trip Planner','Outstanding group trip with friends. The 17-seater Tempo Traveller had customized atmospheric lighting and massive legroom. The driver knew all the best local food stops!')`);
            console.log('Seeded database with initial mock reviews.');
        }

        // Seed fleet
        const flc = await pool.query('SELECT COUNT(*) FROM fleet');
        if (parseInt(flc.rows[0].count) === 0) {
            await pool.query(`INSERT INTO fleet (name,category,badge,seats,description,features,photos,sort_order) VALUES
                ('Innova','Premium','Premium','6-7 Seats','Perfect for corporate transfers or luxury family getaways. Features plush leather seating, dual-zone climate control, and generous luggage space.','["Dual Zone A/C","Leather Seating","Ample Luggage Room"]','["assets/innova.jpg"]',1),
                ('Family Van','Popular','Popular','7-8 Seats','Designed with family comfort in mind. Offers a budget-friendly way to travel together without compromising on comfort and safety.','["Flexible Seating","Low Travel Costs","High Ride Comfort"]','["assets/family_van.jpg"]',2),
                ('Tempo Traveller','Group Travel','Group Travel','12-26 Seats','The ultimate group vacation machine. Features an advanced high-fidelity surround sound system, reclining seats, and custom ambient lighting.','["Premium Audio & Screen","Reclining Push-back Seats","Personalized LED Lighting"]','["assets/tempo_traveller.jpg"]',3)`);
            console.log('Seeded database with initial fleet data.');
        }

        // Seed contact settings
        const cc = await pool.query('SELECT COUNT(*) FROM contact_settings');
        if (parseInt(cc.rows[0].count) === 0) {
            await pool.query(`INSERT INTO contact_settings (key,value) VALUES
                ('phone1','+91 79048 27570'),('phone2','+91 75986 01989'),
                ('whatsapp','917598601989'),('facebook_url','#'),('instagram_url','#')`);
            console.log('Seeded database with initial contact settings.');
        }

    } catch (err) {
        console.error('PostgreSQL Connection or Seeding failed:', err.message);
    }
}

initDb();

// ==========================================
// BOOKINGS
// ==========================================
app.get('/api/bookings', async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM bookings ORDER BY id DESC')).rows); }
    catch (err) { res.status(500).json({ error: 'Database error reading bookings' }); }
});

app.post('/api/bookings', async (req, res) => {
    const { booking_date, name, phone, email, pickup, dropoff, trip_type, vehicle, passengers, special_instructions } = req.body;
    if (!booking_date || !name || !phone || !pickup || !dropoff || !trip_type || !vehicle || !passengers)
        return res.status(400).json({ error: 'Missing required booking fields' });
    try {
        const result = await pool.query(
            `INSERT INTO bookings (booking_date,name,phone,email,pickup,dropoff,trip_type,vehicle,passengers,special_instructions) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [booking_date, name, phone, email, pickup, dropoff, trip_type, vehicle, parseInt(passengers), special_instructions]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Database error writing booking' }); }
});

app.put('/api/bookings/:id', async (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status required' });
    try {
        const result = await pool.query('UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
        if (!result.rows.length) return res.status(404).json({ error: 'Booking not found' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Database error updating booking' }); }
});

app.delete('/api/bookings/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM bookings WHERE id=$1 RETURNING *', [req.params.id]);
        if (!result.rows.length) return res.status(404).json({ error: 'Booking not found' });
        res.json({ message: 'Deleted', deleted: result.rows[0] });
    } catch (err) { res.status(500).json({ error: 'Database error deleting booking' }); }
});

// ==========================================
// FEEDBACK
// ==========================================
app.get('/api/feedback', async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM feedback ORDER BY id DESC')).rows); }
    catch (err) { res.status(500).json({ error: 'Database error reading feedback' }); }
});

app.post('/api/feedback', async (req, res) => {
    const { name, rating, critique } = req.body;
    if (!name || !rating || !critique) return res.status(400).json({ error: 'Missing fields' });
    try {
        const result = await pool.query('INSERT INTO feedback (name,rating,critique) VALUES ($1,$2,$3) RETURNING *', [name, parseInt(rating), critique]);
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Database error writing feedback' }); }
});

app.delete('/api/feedback/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM feedback WHERE id=$1 RETURNING *', [req.params.id]);
        if (!result.rows.length) return res.status(404).json({ error: 'Feedback not found' });
        res.json({ message: 'Feedback deleted', deleted: result.rows[0] });
    } catch (err) { res.status(500).json({ error: 'Database error deleting feedback' }); }
});

// ==========================================
// PUBLIC REVIEWS
// ==========================================
app.get('/api/reviews', async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM reviews ORDER BY id DESC')).rows); }
    catch (err) { res.status(500).json({ error: 'Database error reading reviews' }); }
});

app.post('/api/reviews', async (req, res) => {
    const { name, rating, role, review } = req.body;
    if (!name || !rating || !role || !review) return res.status(400).json({ error: 'Missing fields' });
    try {
        const result = await pool.query('INSERT INTO reviews (name,rating,role,review) VALUES ($1,$2,$3,$4) RETURNING *', [name, parseInt(rating), role, review]);
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Database error writing review' }); }
});

app.delete('/api/reviews/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM reviews WHERE id=$1 RETURNING *', [req.params.id]);
        if (!result.rows.length) return res.status(404).json({ error: 'Review not found' });
        res.json({ message: 'Review deleted', deleted: result.rows[0] });
    } catch (err) { res.status(500).json({ error: 'Database error deleting review' }); }
});

// ==========================================
// FLEET
// ==========================================
const parseFleet = (rows) => rows.map(v => ({
    ...v,
    photos: JSON.parse(v.photos || '[]'),
    features: JSON.parse(v.features || '[]')
}));

app.get('/api/fleet', async (req, res) => {
    try { res.json(parseFleet((await pool.query('SELECT * FROM fleet WHERE is_active=true ORDER BY sort_order ASC, id ASC')).rows)); }
    catch (err) { res.status(500).json({ error: 'Database error reading fleet' }); }
});

app.get('/api/admin/fleet', async (req, res) => {
    try { res.json(parseFleet((await pool.query('SELECT * FROM fleet ORDER BY sort_order ASC, id ASC')).rows)); }
    catch (err) { res.status(500).json({ error: 'Database error reading fleet' }); }
});

app.post('/api/fleet', async (req, res) => {
    const { name, category, badge, seats, description, features, photos, sort_order } = req.body;
    if (!name || !category || !seats || !description) return res.status(400).json({ error: 'Missing required fields' });
    try {
        const result = await pool.query(
            `INSERT INTO fleet (name,category,badge,seats,description,features,photos,sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [name, category, badge || category, seats, description, JSON.stringify(features || []), JSON.stringify(photos || []), sort_order || 99]
        );
        res.status(201).json({ ...result.rows[0], photos: photos || [], features: features || [] });
    } catch (err) { res.status(500).json({ error: 'Database error adding vehicle' }); }
});

app.put('/api/fleet/:id', async (req, res) => {
    const { name, category, badge, seats, description, features, photos, is_active, sort_order } = req.body;
    try {
        const result = await pool.query(
            `UPDATE fleet SET name=$1,category=$2,badge=$3,seats=$4,description=$5,features=$6,photos=$7,is_active=$8,sort_order=$9 WHERE id=$10 RETURNING *`,
            [name, category, badge || category, seats, description, JSON.stringify(features || []), JSON.stringify(photos || []),
             is_active !== undefined ? is_active : true, sort_order || 0, req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Vehicle not found' });
        res.json({ ...result.rows[0], photos: photos || [], features: features || [] });
    } catch (err) { res.status(500).json({ error: 'Database error updating vehicle' }); }
});

app.delete('/api/fleet/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM fleet WHERE id=$1 RETURNING *', [req.params.id]);
        if (!result.rows.length) return res.status(404).json({ error: 'Vehicle not found' });
        res.json({ message: 'Vehicle deleted', deleted: result.rows[0] });
    } catch (err) { res.status(500).json({ error: 'Database error deleting vehicle' }); }
});

// ==========================================
// CONTACT SETTINGS
// ==========================================
app.get('/api/contact-settings', async (req, res) => {
    try {
        const result = await pool.query('SELECT key,value FROM contact_settings');
        const settings = {};
        result.rows.forEach(r => { settings[r.key] = r.value; });
        res.json(settings);
    } catch (err) { res.status(500).json({ error: 'Database error reading contact settings' }); }
});

app.put('/api/contact-settings', async (req, res) => {
    try {
        for (const [key, value] of Object.entries(req.body)) {
            await pool.query(
                `INSERT INTO contact_settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=CURRENT_TIMESTAMP`,
                [key, value]
            );
        }
        const result = await pool.query('SELECT key,value FROM contact_settings');
        const settings = {};
        result.rows.forEach(r => { settings[r.key] = r.value; });
        res.json(settings);
    } catch (err) { res.status(500).json({ error: 'Database error updating contact settings' }); }
});

app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}/`);
});
