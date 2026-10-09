-- 007: Replace the placeholder / test menu with the real Gungjeon menu.
-- WARNING: deleting menu items also deletes their side-dish request history (test data only).
-- Price 0 = "Included" on the website.

begin;

delete from public.menu_items;

insert into public.menu_items (category, name, description, price) values
  -- Unli Sets
  ('Unli Sets', 'Royal Feast', 'Unli Pork, Beef and Grilled Chicken Fillet; Unli Side Dishes; Unli Crabs, Shrimp, Mussels and Squid; Unli Enoki Mushroom; Unli Cajun Mixed Seafood; Unli Buttered Seafood; Unli Salmon Sashimi; Unli Roast Beef; Unli Cheese; Unli Iced Tea', 699),
  ('Unli Sets', 'Unli ₱549', 'Unli Pork, Beef and Grilled Chicken Fillet; Unli Side Dishes; Unli Enoki Mushroom; Unli Cheese; Unli Iced Tea', 549),
  ('Unli Sets', 'Unli ₱399', 'Unli Pork and Grilled Chicken Fillet; Unli Side Dishes', 399),
  ('Unli Sets', 'Unli ₱299', 'Unli Pork; Unli Side Dishes', 299),

  -- Side Dishes (the category name must stay exactly "Side Dishes")
  ('Side Dishes', 'Kimchi', null, 0),
  ('Side Dishes', 'Lettuce', null, 0),
  ('Side Dishes', 'Fishcake', null, 0),
  ('Side Dishes', 'Caesar Salad', null, 0),
  ('Side Dishes', 'Japchae', null, 0),
  ('Side Dishes', 'Cucumber Relish', null, 0),
  ('Side Dishes', 'Fluffy Egg', null, 0),
  ('Side Dishes', 'Rice', null, 0),
  ('Side Dishes', 'Enoki Mushroom', 'For the Unli ₱549 and Royal Feast sets.', 0),
  ('Side Dishes', 'Unli Cheese', 'For the Unli ₱549 and Royal Feast sets.', 0),
  ('Side Dishes', 'Unli Iced Tea', 'For the Unli ₱549 and Royal Feast sets.', 0),

  -- Pork
  ('Pork', 'Pork BBQ', null, 0),
  ('Pork', 'Pork Teriyaki', null, 0),
  ('Pork', 'Pork Bulgogi', null, 0),
  ('Pork', 'Pork Spicy Korean', null, 0),
  ('Pork', 'Pork Sweet and Spicy', null, 0),
  ('Pork', 'Pork Curry', null, 0),
  ('Pork', 'Pork Herb-Cut', null, 0),
  ('Pork', 'Pork Salt and Pepper', null, 0),
  ('Pork', 'Pork Plain', null, 0),
  ('Pork', 'Pork Enoki', 'For the Unli ₱549 and Royal Feast sets.', 0),

  -- Beef
  ('Beef', 'Beef BBQ', null, 0),
  ('Beef', 'Beef Teriyaki', null, 0),
  ('Beef', 'Beef Bulgogi', null, 0),
  ('Beef', 'Beef Spicy Korean', null, 0),
  ('Beef', 'Beef Sweet and Spicy', null, 0),
  ('Beef', 'Beef Curry', null, 0),
  ('Beef', 'Beef Herb-Cut', null, 0),
  ('Beef', 'Beef Salt and Pepper', null, 0),
  ('Beef', 'Beef Plain', null, 0),
  ('Beef', 'Beef Enoki', 'For the Unli ₱549 and Royal Feast sets.', 0),

  -- Grilled Chicken
  ('Grilled Chicken', 'Chicken BBQ', null, 0),
  ('Grilled Chicken', 'Spicy Chicken', null, 0),
  ('Grilled Chicken', 'Chicken Bulgogi', null, 0),
  ('Grilled Chicken', 'Chicken Salt and Pepper', null, 0),

  -- King & Queen's Favorite
  ('King & Queen''s Favorite', 'Salmon Sashimi', null, 0),
  ('King & Queen''s Favorite', 'Raw Alimasag', null, 0),
  ('King & Queen''s Favorite', 'Squid', null, 0),
  ('King & Queen''s Favorite', 'Shrimps', null, 0),
  ('King & Queen''s Favorite', 'Mussels', null, 0),
  ('King & Queen''s Favorite', 'Roast Beef', null, 0),

  -- Seafood Paluto
  ('Seafood Paluto', 'Cajun Mixed Seafood', null, 0),
  ('Seafood Paluto', 'Buttered Mixed Seafood', null, 0),

  -- Sauces
  ('Sauces', 'Ssamjang', null, 0),
  ('Sauces', 'Teriyaki', null, 0),
  ('Sauces', 'Special Vinegar', null, 0);

commit;

-- Check: how many items in each category?
select category, count(*) as items
from public.menu_items
group by category
order by category;