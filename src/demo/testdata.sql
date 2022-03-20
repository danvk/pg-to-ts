INSERT INTO users(id, name, pronoun) VALUES (
    'dee5e220-1f62-4f80-ad29-3ad48a03a36e',
    'John Deere',
    'he/him'
),
(
    'd0e23a20-1f62-4f80-ad29-3ad48a03a47f',
    'Jane Doe',
    'she/her'
);

INSERT INTO doc(id, created_by, title, contents) VALUES (
    'cde34b31-1f62-4f80-ad29-3ad48a03a36e',
    'dee5e220-1f62-4f80-ad29-3ad48a03a36e', -- John Deere
    'Annual Plan for 2022',
    'World domination'
),
(
    '01234b31-1f62-4f80-ad29-3ad48a03a36e',
    'd0e23a20-1f62-4f80-ad29-3ad48a03a47f', -- Jane Doe
    'Vision 2023',
    'Future so bright'
);

INSERT INTO COMMENT(id, doc_id, author_id, created_at, modified_at, metadata, content_md, statuses) VALUES (
    '01234567-1f62-4f80-ad29-3ad48a03a36e',
    'cde34b31-1f62-4f80-ad29-3ad48a03a36e', -- Annual plan for 2022
    'd0e23a20-1f62-4f80-ad29-3ad48a03a47f', -- Jane Doe
    '2022-03-20 01:02:03+00',
    '2022-03-20 01:02:03+00',
    '{"sentiment": "snarky"}'::jsonb,
    'Why are we only writing this doc in March?',
    ARRAY['complete'::comment_status_enum]
),
(
    '12345678-1f62-4f80-ad29-3ad48a03a36e',
    '01234b31-1f62-4f80-ad29-3ad48a03a36e', -- Vision 2023
    'dee5e220-1f62-4f80-ad29-3ad48a03a36e', -- John Deere
    '2022-03-19 01:02:03+00',
    '2022-03-19 01:02:03+00',
    '{"sentiment": "happy"}'::jsonb,
    'I am _so_ inspired by this!',
    ARRAY['complete'::comment_status_enum]
);
