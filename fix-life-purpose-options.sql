-- Add missing options for Life Purpose Explorer assessment questions
-- Question 6: "When you imagine your ideal life 5 years from now, what aspect excites you most?"
INSERT INTO assessment_options (question_id, option_text, position, score_value, is_correct) VALUES
(6, 'The meaningful impact I''ll have on others', 1, 3, false),
(6, 'The creative projects I''ll have completed', 2, 2, false),
(6, 'The personal growth and wisdom I''ll have gained', 3, 4, false),
(6, 'The financial freedom and stability I''ll enjoy', 4, 1, false);

-- Question 7: "What activities make you lose track of time because you enjoy them so much?"
INSERT INTO assessment_options (question_id, option_text, position, score_value, is_correct) VALUES
(7, 'Learning new skills or exploring ideas', 1, 2, false),
(7, 'Creating art, writing, or other creative work', 2, 4, false),
(7, 'Helping others solve problems or feel better', 3, 3, false),
(7, 'Building or organizing systems and processes', 4, 1, false);
