-- =============================================================
--  TOLR.net  --  Full Database Export
--  Generated : 2026-04-09
--  Target    : PostgreSQL (ANSI-compatible; should run on
--              MySQL 8+, MariaDB 10.5+, or SQLite 3.35+ with
--              minor type adjustments noted in comments)
-- =============================================================

-- -------------------------------------------------------------
--  SAFETY NET
--  Drop tables in reverse dependency order so foreign-key
--  constraints (if added later) won't block the drops.
-- -------------------------------------------------------------
DROP TABLE IF EXISTS "Booking";
DROP TABLE IF EXISTS "Faq";
DROP TABLE IF EXISTS "Offering";
DROP TABLE IF EXISTS "Course";
DROP TABLE IF EXISTS "Service";

-- =============================================================
--  TABLE: Service
--  High-level service categories displayed on the Services
--  section of the site.
-- =============================================================
CREATE TABLE "Service" (
  "id"              VARCHAR(36)   NOT NULL PRIMARY KEY,
  "switch"          SMALLINT      NOT NULL DEFAULT 1,   -- 1 = visible, 0 = hidden
  "order"           INTEGER       NOT NULL DEFAULT 0,   -- lower = appears first
  "title"           TEXT          NOT NULL,
  "description"     TEXT          NOT NULL,
  "iconSrc"         VARCHAR(255)  NOT NULL,
  "cardImageSrc"    VARCHAR(255)  NOT NULL,
  "cardImageAlt"    VARCHAR(255)  NOT NULL,
  "listItems"       TEXT          NOT NULL,             -- JSON array string
  "createdAt"       TIMESTAMP     NOT NULL,
  "updatedAt"       TIMESTAMP     NOT NULL,
  "createdByUserId" VARCHAR(36)
);

INSERT INTO "Service" ("id","switch","order","title","description","iconSrc","cardImageSrc","cardImageAlt","listItems","createdAt","updatedAt","createdByUserId") VALUES
(
  'b87b9a61-1611-4dbb-a387-243a07901ab4', 1, 1,
  'First Aid, CPR & Bleeding Control',
  'Hands-on training for life-saving emergencies. Learn by doing. You will be ready to act quickly when every second counts.',
  'ICON_6',
  'SERVICE_IMG_FIRST_AID',
  'CPR Training',
  '["1st Aid and CPR","Tourniquet Use","Bleeding Control","BLS Certification"]',
  '2026-03-25 19:08:04', '2026-04-02 14:14:08', '69c2f5958256d2186c632dec'
),
(
  '31809539-4b41-471e-a93b-5f725bdb0b82', 1, 2,
  'Situational Awareness and Deescalation',
  'Personal defense using escape and evasion and/or less lethal options. We have all heard Run, Hide, Fight. We must also understand the Flight, Fight, Freeze',
  'ICON_8',
  'SERVICE_IMG_AWARENESS',
  'Safe and Secure Facility',
  '["Refuse to be a Victim","Situational Awareness","Realistic Deescalation","For Civilians and L.E.O."]',
  '2026-03-25 19:08:04', '2026-04-02 14:14:09', '69c2f5958256d2186c632dec'
),
(
  'bfbeb68e-b471-4ff0-92e8-ecdf98cedfdc', 1, 3,
  'Personal Protection',
  'Personal defense using escape and evasion and/or less lethal options. We must understand our body''s "Flight, Fight, Freeze" response and learn to manage it.',
  'ICON_9',
  'SERVICE_IMG_PROTECTION',
  'Less-Lethal Personal Defense',
  '["Active Shooter Response","Basic Defense and Escape","O.C., Sprays for Civilians","Conducted Energy Devices (stun guns) for Civilians"]',
  '2026-03-25 19:08:04', '2026-04-02 14:14:09', '69c2f5958256d2186c632dec'
),
(
  '48ba1fd4-ec38-4650-a06f-78ec400534e1', 1, 4,
  'T.O.L.R. - Tools of Last Resort',
  'T.O.L.R. = Tools of Last Resort.   What are the T.O.L.R.?  Firearms.   Handguns for self defense and protection of others',
  'ICON_10',
  'SERVICE_IMG_TOLR',
  'T.O.L.R - Tools of Last Resort',
  '["Entry Level Pistol","NRA Basic Pistol","Defensive Pistol","NJ State Permit to Carry"]',
  '2026-03-25 19:08:04', '2026-04-02 14:14:09', '69c2f5958256d2186c632dec'
);

-- =============================================================
--  TABLE: Course  (unified — replaces Offering table)
--  Training programs displayed on the Courses section AND the
--  Course Investment section.  Fields added in merge step 1:
--    button1Text  VARCHAR(255) DEFAULT 'Contact Now'
--    button2Text  VARCHAR(255) DEFAULT 'Group Rate'
--  The duration field now holds the long-form scheduling note
--  used by the Course Investment UI, e.g.:
--    "4 Hours • Contact us to arrange a class"
-- =============================================================
CREATE TABLE "Course" (
  "id"              VARCHAR(36)   NOT NULL PRIMARY KEY,
  "switch"          SMALLINT      NOT NULL DEFAULT 1,
  "order"           INTEGER       NOT NULL DEFAULT 0,
  "title"           TEXT          NOT NULL,
  "category"        VARCHAR(100)  NOT NULL,
  "price"           VARCHAR(50)   NOT NULL,
  "priceNote"       VARCHAR(255),
  "duration"        VARCHAR(255)  NOT NULL,             -- long-form: "4 Hours • Contact us to arrange a class"
  "description"     TEXT          NOT NULL,
  "features"        TEXT          NOT NULL,             -- comma-separated or JSON string
  "buttonText"      VARCHAR(255)  NOT NULL,
  "button1Text"     VARCHAR(255)           DEFAULT 'Contact Now',  -- Course Investment primary CTA
  "button2Text"     VARCHAR(255)           DEFAULT 'Group Rate',   -- Course Investment secondary CTA
  "createdAt"       TIMESTAMP     NOT NULL,
  "updatedAt"       TIMESTAMP     NOT NULL,
  "createdByUserId" VARCHAR(36)
);

-- NOTE: duration now holds the long-form Course Investment note.
-- button1Text / button2Text populated from matching Offering records.
INSERT INTO "Course" ("id","switch","order","title","category","price","priceNote","duration","description","features","buttonText","button1Text","button2Text","createdAt","updatedAt","createdByUserId") VALUES
(
  '2c3a12be-7fc2-4fea-bfb6-683031779de9', 1, 1,
  'Refuse To Be A Victim',
  'Personal Awareness',
  '$49', 'per person - 4 person minimum',
  '4 Hours • Contact us to arrange a class (Minimum 4 Attendees)',
  'A comprehensive seminar focused on situational awareness and personal safety strategies.',
  '"Basic Safety Fundamentals","At Home, Work and Away","Classroom Instruction","Training Materials","Certificate of Completion"',
  'Contact Us Now To Schedule', 'Contact Now', 'Group Rate',
  '2026-03-24 22:34:40', '2026-04-02 14:43:10', '69c2f5958256d2186c632dec'
),
(
  '5285d4f6-8ea2-4eac-9c47-07d0ff1f49ec', 1, 2,
  'Situational Awareness Level 1',
  'Personal Awareness',
  '$95', 'per person',
  '2 Hours • Contact us to arrange a class',
  'Master the art of identifying threats before they escalate with our Level 1 certification.',
  '"Realistic Scenarios","Practical Application","Reference Materials","Certificate of Completion"',
  'Contact Us Now To Schedule', 'Contact Now', 'Group Rate',
  '2026-03-24 22:34:40', '2026-04-02 14:14:05', '69c2f5958256d2186c632dec'
),
(
  '707abd3e-c396-4e13-9a5f-43b6de33e432', 1, 3,
  'De-escalation That Works',
  'Personal Awareness',
  '$95', 'per person',
  '2 Hours • Contact us to arrange a class',
  'Learn proven verbal and non-verbal techniques to diffuse high-tension situations safely.',
  '"How To Go From Bad To Better","Reduce The Chance Of Violence","Practical Training","Training Materials","Certificate of Completion"',
  'Contact Us Now To Schedule', 'Contact Now', 'Group Rate',
  '2026-03-24 22:34:40', '2026-04-02 14:14:06', '69c2f5958256d2186c632dec'
),
(
  '838072cd-f86e-4b1e-8ee6-f51ef021a1dd', 1, 4,
  'First Aid CPR AED',
  'First Aid',
  '$125', 'per person - 4 person minimum',
  '4 Hours • Contact us to arrange a class',
  'Comprehensive first aid, CPR, and AED training. Gain certification-ready skills for responding to medical emergencies.',
  '"HSI or AHA Certification Course","Hands-on Practical Exam","2025 Standards Compliant","Student E-Workbook Provided","Certificate and Card Provided"',
  'Contact Us Now To Schedule', 'Contact Now', 'Group Rate',
  '2026-03-24 22:34:40', '2026-04-02 14:14:06', '69c2f5958256d2186c632dec'
),
(
  '417ed123-5374-4d09-8825-fa876ea13b39', 1, 5,
  'BLS – Basic Life Saving for Rescuers',
  'First Aid',
  '$125', 'per person',
  '4 Hours • Contact us to arrange a class',
  'Comprehensive CPR and AED training for professional rescuers, EMTs, Nurses, other healthcare providers and lifeguards.',
  '"HSI or AHA Certification Course","Written and Hands-on Exam","Meets NJ State Compliance","Priority Scheduling for professionals"',
  'Contact Us Now To Schedule', 'Contact Now', 'Group Rate',
  '2026-03-25 19:08:03', '2026-04-02 14:14:06', '69c2f5958256d2186c632dec'
),
(
  '1641d5cb-2ce5-41c4-b276-2af1a617ddf3', 1, 6,
  'MACE Personal Defense Spray',
  'Personal Defense',
  '$125', 'per person',
  '3 Hours • Contact us to arrange a class',
  'Learn the safe and effective use of MACE personal defense spray for civilians in NJ, including proper deployment, legal considerations, and scenario practice.',
  '"Basic Safety Fundamentals","Classroom Instruction","Inert Agent Practice","Training Materials","NJ Compliant OC Spray Provided","Certificate of Completion"',
  'Contact Us Now To Schedule', 'Contact Now', 'Group Rate',
  '2026-03-25 19:08:03', '2026-04-02 14:43:18', '69c2f5958256d2186c632dec'
),
(
  '1421e80c-6702-4380-9485-6d9800c2e76f', 1, 7,
  'Conducted Energy Devices',
  'Personal Defense',
  '$125', 'per person',
  '3 Hours • Contact us to arrange a class',
  'Introduction to conducted energy devices for civilians. Learn safety protocols, legal use, and practical application in self-defense situations.',
  '"Basic Safety Fundamentals","Classroom Instruction","Practice on Training Targets","Personal Contact CED Included","Training Materials Provided","Certificate of Completion"',
  'Contact Us Now To Schedule', 'Contact Now', 'Group Rate',
  '2026-03-25 19:08:04', '2026-04-02 14:14:07', '69c2f5958256d2186c632dec'
),
(
  '969218d2-2e6f-4567-a938-9c6322fdfae0', 1, 8,
  'Stop The Bleed',
  'First Aid',
  '$49', 'per person',
  '2 Hours • Contact us to arrange a class (Minimum 4 Attendees)',
  'Life-saving training focused on rapid bleeding control and tourniquet application. Essential skills for emergency response.',
  '"Traumatic Bleeding First Aid","Hands On Training","Wound Packing","Tourniquet Use","Certificate of Completion"',
  'Contact Us Now To Schedule', 'Contact Now', 'Group Rate',
  '2026-03-25 19:08:04', '2026-04-02 14:14:07', '69c2f5958256d2186c632dec'
),
(
  '938feb6e-2136-4847-8691-6c0c870310f4', 1, 9,
  'ETCC Emergency Tactical Casualty Control',
  'First Aid',
  '$125', 'per person',
  '4 Hours • Contact us to arrange a class',
  'Traumatic Bleeding Skills for Emergency Responders, Law Enforcement, Security, beyond Stop The Bleed with significant hands on practice on simulated bleeding wounds. Chest seal application and review of IFAK contents and requirements.',
  '"Traumatic bleeding intervention","For tactical or high risk situations","Beyond Stop The Bleed","Tactical or under threat considerations"',
  'Contact Us Now To Schedule', 'Contact Now', 'Group Rate',
  '2026-03-26 01:53:23', '2026-04-02 14:14:08', '69c2f5958256d2186c632dec'
);

-- =============================================================
--  TABLE: Offering
--  Course investment list items (Course Investment section).
-- =============================================================
CREATE TABLE "Offering" (
  "id"              VARCHAR(36)   NOT NULL PRIMARY KEY,
  "switch"          SMALLINT      NOT NULL DEFAULT 1,
  "order"           INTEGER       NOT NULL DEFAULT 0,
  "title"           TEXT          NOT NULL,
  "price"           VARCHAR(50)   NOT NULL,
  "priceNote"       VARCHAR(255),
  "duration"        VARCHAR(255)  NOT NULL,
  "button1Text"     VARCHAR(255)  NOT NULL,
  "button2Text"     VARCHAR(255)  NOT NULL,
  "createdAt"       TIMESTAMP     NOT NULL,
  "updatedAt"       TIMESTAMP     NOT NULL,
  "createdByUserId" VARCHAR(36)
);

INSERT INTO "Offering" ("id","switch","order","title","price","priceNote","duration","button1Text","button2Text","createdAt","updatedAt","createdByUserId") VALUES
(
  '9ebbf5af-dbf5-431e-a911-d0d912415573', 1, 1,
  'Stop The Bleed',
  '$49', 'per person',
  '2 Hours • Contact us to arrange a class (Minimum 4 Attendees)',
  'Contact Now', 'Group Rate',
  '2026-04-02 01:15:25', '2026-04-02 14:14:09', '69c2f5958256d2186c632dec'
),
(
  'd5f0f81d-eea1-4d3d-8e57-0b57869c7e63', 1, 2,
  'First Aid CPR AED',
  '$125', 'per person',
  '4 Hours • Contact us to arrange a class',
  'Contact Now', 'Group Rate',
  '2026-04-02 01:15:25', '2026-04-02 14:14:09', '69c2f5958256d2186c632dec'
),
(
  '0da9d378-de00-48dc-af72-c89cce4d9be7', 1, 3,
  'ETCC Emergency Tactical Casualty Control',
  '$125', 'per person',
  '4 Hours • Contact us to arrange a class',
  'Contact Now', 'Group Rate',
  '2026-04-02 01:15:25', '2026-04-02 14:14:10', '69c2f5958256d2186c632dec'
),
(
  'e1168af8-dc25-46c3-b935-580dde4c6e0c', 1, 4,
  'BLS – Basic Life Saving for Rescuers',
  '$125', 'per person',
  '4 Hours • Contact us to arrange a class',
  'Contact Now', 'Group Rate',
  '2026-04-02 01:15:25', '2026-04-02 14:14:10', '69c2f5958256d2186c632dec'
),
(
  '1a020194-751a-417f-973f-b5bdfcd563f8', 1, 5,
  'Refuse To Be A Victim',
  '$49', 'per person',
  '4 Hours • Contact us to arrange a class (Minimum 4 Attendees)',
  'Contact Now', 'Group Rate',
  '2026-04-02 01:15:25', '2026-04-02 14:42:50', '69c2f5958256d2186c632dec'
),
(
  '295d09a7-5f13-4afb-90e0-4e3a76860be8', 1, 6,
  'Situational Awareness Lvl 1',
  '$95', 'per person',
  '2 Hours • Contact us to arrange a class',
  'Contact Now', 'Group Rate',
  '2026-04-02 01:15:26', '2026-04-02 14:14:10', '69c2f5958256d2186c632dec'
),
(
  '8cd6c836-dd46-4f41-81b8-3ae3c6876fd9', 1, 7,
  'De-escalation That Works',
  '$95', 'per person',
  '2 Hours • Contact us to arrange a class',
  'Contact Now', 'Group Rate',
  '2026-04-02 01:15:26', '2026-04-02 14:14:11', '69c2f5958256d2186c632dec'
),
(
  'b4dabb77-d5ff-4c24-ad01-3d11c7976e4e', 1, 8,
  'MACE Personal Defense Spray',
  '$125', 'per person',
  '3 Hours • Contact us to arrange a class',
  'Contact Now', 'Group Rate',
  '2026-04-02 01:15:26', '2026-04-02 14:42:58', '69c2f5958256d2186c632dec'
),
(
  '3e009860-92c3-4843-98b0-82df0db99ef1', 1, 9,
  'Conducted Energy Devices Level 1',
  '$125', 'per person',
  '3 Hours • Contact us to arrange a class',
  'Contact Now', 'Group Rate',
  '2026-04-02 01:15:26', '2026-04-02 14:14:11', '69c2f5958256d2186c632dec'
);

-- =============================================================
--  TABLE: Faq
--  Frequently asked questions section.
-- =============================================================
CREATE TABLE "Faq" (
  "id"              VARCHAR(36)   NOT NULL PRIMARY KEY,
  "switch"          SMALLINT      NOT NULL DEFAULT 1,
  "order"           INTEGER       NOT NULL DEFAULT 0,
  "question"        TEXT          NOT NULL,
  "answer"          TEXT          NOT NULL,
  "link"            TEXT,                               -- empty string or URL
  "linktext"        TEXT,                               -- empty string or display text
  "createdAt"       TIMESTAMP     NOT NULL,
  "updatedAt"       TIMESTAMP     NOT NULL,
  "createdByUserId" VARCHAR(36)
);

INSERT INTO "Faq" ("id","switch","order","question","answer","link","linktext","createdAt","updatedAt","createdByUserId") VALUES
(
  '2ff7200d-eda7-460b-89b9-7036e905275c', 1, 1,
  'Do I need a permit or ID to take a firearms safety course?',
  'No permit is required to enroll in our NJ Firearms Safety courses. However, per New Jersey law, a valid government-issued photo ID is required on the day of class. If you plan to apply for a Firearms Purchaser ID Card or a Permit to Purchase a Handgun after completing the course, we can walk you through exactly what documentation the NJ State Police require — just ask at check-in.',
  '', '',
  '2026-04-02 19:47:33', '2026-04-02 19:47:33', '69c2f5958256d2186c632dec'
),
(
  '895f10d9-9f9e-4b47-ad19-2e59dfe6444c', 1, 2,
  'How large are your classes?',
  'We keep class sizes intentionally small — typically 6 to 12 participants — so every student gets hands-on attention from the instructor. Larger groups can be accommodated for corporate or group bookings; contact us to discuss a private session.',
  '', '',
  '2026-04-02 19:47:33', '2026-04-02 19:47:33', '69c2f5958256d2186c632dec'
),
(
  'ebf334e1-fd40-43ce-812b-ddadbed6fa84', 1, 3,
  'How long is my certification valid?',
  'CPR/AED and First Aid certifications issued through our courses are valid for 2 years from the date of completion, in line with American Heart Association and Red Cross guidelines. Firearms safety certificates do not expire under NJ law, though we recommend periodic refresher training. We''ll remind you when your renewal is coming up if you provide an email at booking.',
  '', '',
  '2026-04-02 19:47:33', '2026-04-02 19:47:33', '69c2f5958256d2186c632dec'
),
(
  'ad5db66d-60c7-40ba-bc23-a6320668a509', 1, 4,
  'Are your courses accepted by the NJ State Police?',
  'Yes. Our NJ Firearms Safety course satisfies the safety-training requirement for the NJ Firearms Purchaser Identification Card and Permit to Purchase a Handgun applications. Completion certificates are issued immediately after class.',
  '', '',
  '2026-04-02 19:47:33', '2026-04-02 19:47:33', '69c2f5958256d2186c632dec'
),
(
  '8080c1ca-0cb6-474a-9852-d247c3c0a597', 1, 5,
  'What should I bring to class?',
  'Bring a valid photo ID, comfortable clothing you can move in, and a notepad if you like to take notes. All training materials, mannequins (for CPR), and equipment are provided. For firearms courses, ammunition and range equipment are included — you do not need to bring your own firearm unless specifically noted in your course description.',
  '', '',
  '2026-04-02 19:47:34', '2026-04-02 19:47:34', '69c2f5958256d2186c632dec'
),
(
  '31c4cb3a-92cc-4625-a403-896aaed23b7c', 1, 6,
  'Do you offer private or corporate group training?',
  'Absolutely. We offer on-site and facility-based private sessions for businesses, security teams, schools, and community organizations throughout New Jersey. Group rates are available. Use the booking form above or call us directly to discuss scheduling and pricing for your team.',
  '', '',
  '2026-04-02 19:47:34', '2026-04-02 19:47:34', '69c2f5958256d2186c632dec'
),
(
  '2ccef672-9b04-4ef2-987d-cbeeb8c670a7', 1, 7,
  'What is your cancellation and refund policy?',
  'Cancellations made at least 48 hours before your scheduled class receive a full refund or free reschedule. Cancellations within 48 hours may be rescheduled once at no charge. No-shows forfeit their seat. If we ever need to cancel a class due to low enrollment or circumstances beyond our control, you''ll receive a full refund and priority re-enrollment.',
  '', '',
  '2026-04-02 19:47:34', '2026-04-02 19:47:34', '69c2f5958256d2186c632dec'
);

-- =============================================================
--  TABLE: Booking
--  Course registration and inquiry submissions.
-- =============================================================
CREATE TABLE "Booking" (
  "id"                VARCHAR(36)   NOT NULL PRIMARY KEY,
  "switch"            SMALLINT      NOT NULL DEFAULT 1,
  "order"             INTEGER       NOT NULL DEFAULT 0,
  "fullName"          VARCHAR(255)  NOT NULL,
  "email"             VARCHAR(255)  NOT NULL,
  "phone"             VARCHAR(50),
  "course"            VARCHAR(255)  NOT NULL,
  "preferredDate"     TIMESTAMP     NOT NULL,
  "notes"             TEXT,
  "numberOfAttendees" VARCHAR(100),
  "trainingLocation"  VARCHAR(255),
  "requestType"       VARCHAR(50),
  "createdAt"         TIMESTAMP     NOT NULL,
  "updatedAt"         TIMESTAMP     NOT NULL,
  "createdByUserId"   VARCHAR(36)
);

INSERT INTO "Booking" ("id","switch","order","fullName","email","phone","course","preferredDate","notes","numberOfAttendees","trainingLocation","requestType","createdAt","updatedAt","createdByUserId") VALUES
(
  '3b7890b2-9945-44b5-8e8c-d3fe12d1ffc5', 1, 1,
  'Bill Bailey',
  'lawrenceschlack@gmail.com',
  '555-555-4455',
  'BLS – Basic Life Saving for Rescuers',
  '2026-04-03 00:00:00',
  'we have display devices',
  '5-12',
  'Client Location',
  'group',
  '2026-04-01 15:44:25', '2026-04-02 14:14:08', '69c2f5958256d2186c632dec'
);

-- =============================================================
--  END OF SCRIPT
--  Total records exported:
--    Service   : 4
--    Course    : 9  (unified; includes button1Text/button2Text from Offering)
--    Offering  : 9  (to be retired in Step 6)
--    Faq       : 7
--    Booking   : 1
-- =============================================================
