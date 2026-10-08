-- Gungjeon Unlimited — sample data (optional). Safe to re-run: existing rows are skipped.
-- Run after 001 and 002. Prices are PHP; 0 means "included in the unlimited package".

insert into public.tables (table_number, capacity, location) values
  ('1',  4,  'Indoor'),
  ('2',  4,  'Indoor'),
  ('3',  2,  'Indoor'),
  ('4',  6,  'Indoor'),
  ('5',  2,  'Indoor'),
  ('6',  4,  'Indoor'),
  ('7',  4,  'Outdoor'),
  ('8',  6,  'Outdoor'),
  ('9',  4,  'Outdoor'),
  ('10', 2,  'Outdoor'),
  ('PR-A', 10, 'Private room'),
  ('PR-B', 8,  'Private room')
on conflict (table_number) do nothing;

insert into public.menu_items (category, name, description, price)
select v.category, v.name, v.description, v.price
from (values
  -- Set Meals (the two unlimited packages from the original settings: adult 499, kid 299)
  ('Set Meals', 'Unlimited Package — Adult', 'Unlimited grill package, per adult.', 499),
  ('Set Meals', 'Unlimited Package — Kid',   'Unlimited grill package, per child.', 299),

  ('Pork', 'Samgyeopsal (Pork Belly)', 'Thick-cut pork belly, grilled plain so the fat speaks for itself.', 0),
  ('Pork', 'Spicy Pork Bulgogi',       'Marinated pork shoulder in a gochujang glaze, char-grilled to order.', 0),
  ('Pork', 'Pork Jowl',                'A chewier, richer cut for the grill purists at the table.', 0),

  ('Beef', 'Beef Bulgogi',            'Thin-sliced beef in a sweet soy marinade, quick over the flame.', 0),
  ('Beef', 'Beef Short Rib (Galbi)',  'Bone-in short rib, marinated overnight for a deeper char.', 149),
  ('Beef', 'Beef Brisket',            'Lean cut sliced thin, best grilled fast and eaten faster.', 0),

  ('Chicken & Seafood', 'Soy Garlic Chicken Thigh', 'Boneless thigh marinated in soy and garlic.', 0),
  ('Chicken & Seafood', 'Spicy Chicken Bulgogi',    'Gochujang-marinated chicken breast with a slow-building heat.', 0),
  ('Chicken & Seafood', 'Grilled Squid',            'Whole squid, lightly seasoned, grilled until just firm.', 0),
  ('Chicken & Seafood', 'Head-On Shrimp',           'Grilled in the shell to keep the flavor from escaping.', 99),

  ('Side Dishes', 'Kimchi',            'House-fermented napa cabbage.', 0),
  ('Side Dishes', 'Pickled Radish',    'Sweet-tart and crisp.', 0),
  ('Side Dishes', 'Bean Sprout Salad', 'Lightly seasoned with sesame oil and garlic.', 0),
  ('Side Dishes', 'Steamed Egg',       'Soft, savory steamed egg.', 0),
  ('Side Dishes', 'Steamed Rice',      'Refilled as often as the grill needs backup.', 0),
  ('Side Dishes', 'Kimchi Jjigae',     'Kimchi stew, simmered spicy and sour.', 0),
  ('Side Dishes', 'Doenjang Jjigae',   'Soybean paste stew with tofu and vegetables.', 0),

  ('Beverages', 'Iced Barley Tea', 'Roasted, nutty, and unsweetened.', 0),
  ('Beverages', 'Soft Drinks',     'Coke, Sprite, or Royal.', 60),
  ('Beverages', 'Soju',            'Original or flavored, served chilled by the bottle.', 180),

  ('Desserts', 'Soft Serve Swirl', 'Vanilla soft serve, self-serve station.', 0),
  ('Desserts', 'Sikhye',           'A cold, lightly sweet rice punch.', 0)
) as v(category, name, description, price)
where not exists (
  select 1 from public.menu_items m where m.category = v.category and m.name = v.name
);
