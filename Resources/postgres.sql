heroku pg:psql

CREATE TABLE users (
  email varchar(20) NOT NULL UNIQUE PRIMARY KEY,
  password char(32) NOT NULL,
  salt char(16) NOT NULL
);

CREATE TABLE product (
  productID serial NOT NULL PRIMARY KEY,
  description varchar(15) NOT NULL UNIQUE,
  cost decimal NOT NULL
);

CREATE TABLE cart (
  email varchar(40) NOT NULL,
  id serial NOT NULL,
  productID int NOT NULL,
  quantity int NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (email) REFERENCES users (email),
  FOREIGN KEY (productID) REFERENCES product(productID)
);

CREATE TABLE purchases (
  email varchar(40) NOT NULL,
  id serial NOT NULL,
  productID int NOT NULL,
  quantity int NOT NULL,
  date DATE NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (email) REFERENCES users (email),
  FOREIGN KEY (productID) REFERENCES product(productID)
);
