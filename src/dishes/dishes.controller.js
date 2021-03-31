const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

// Validation middleware
function isValidDish(req, res, next) {
  const requiredFields = ["name", "description", "price", "image_url"];
  for (const field of requiredFields) {
    if (!req.body.data[field]) {
      return next({
        status: 400,
        message: `"${field}" is required`,
      });
    }
  }

  next();
}

function dishIdExists(req, res, next) {
  const dishId = req.params.dishId; // dish id is a string
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

// check if req.params.id matches req.body.data.id
function routeIdMatchesDishId(req, res, next) {
  const routeId = req.params.dishId;
  const dishId = req.body.data.id;
  if (!dishId || routeId === dishId) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${dishId}, Route: ${routeId}`,
  });
}

function hasName(req, res, next) {
  if (!req.body.data.name || req.body.data.name === "") {
    return next({
      status: 400,
      message: "Dish must include a name",
    });
  }
  next();
}

function hasDescription(req, res, next) {
  if (!req.body.data.description || req.body.data.description === "") {
    return next({
      status: 400,
      message: "Dish must include a description",
    });
  }
  next();
}
// isNaN(req.body.data.price) check if price is an integer
// (data.price - Math.floor(data.price) !== 0)
function hasPriceGreaterThanZero(req, res, next) {
  if (!req.body.data.price || req.body.data.price <= 0 || typeof req.body.data.price != "number") {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
  next();
}

function hasImageUrl(req, res, next) {
  if (!req.body.data.image_url || req.body.data.image_url === "") {
    return next({
      status: 400,
      message: "Dish must include a image_url",
    });
  }
  next();
}

// Route handler functions

function list(req, res, next) {
  let filteredDishes = [...dishes];
  if (req.params.dishId) {
    filteredDishes = filteredDishes.filter(
      (dish) => dish.dishId === req.params.dishId
    );
  }
  res.json({ data: filteredDishes });
}

function create(req, res, next) {
  const {
    data: { name, description, price, image_url },
  } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  const foundDish = res.locals.dish;
  const updatedDish = Object.assign(foundDish, req.body.data); //merging req.body.data into foundDish
  res.json({ data: updatedDish });
}

module.exports = {
  list,
  dishIdExists,
  create: [isValidDish, hasPriceGreaterThanZero, create],
  read: [dishIdExists, read],
  update: [
    dishIdExists,
    routeIdMatchesDishId,
    hasName,
    hasDescription,
    hasPriceGreaterThanZero,
    hasImageUrl,
    update,
  ],
};