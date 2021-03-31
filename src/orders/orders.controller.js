const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

// Validation middleware
function isValidOrder(req, res, next) {
  const requiredFields = ["deliverTo", "mobileNumber", "dishes"]; //"status" is not in the test
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

function orderIdExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${req.params.orderId}`,
  });
}

function routeIdMatchesOrderId(req, res, next) {
  const routeId = req.params.orderId;
  const orderId = req.body.data.id;
  if (!orderId || routeId === orderId) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${orderId}, Route: ${routeId}.`,
  });
}

function hasValidStatus(req, res, next) {
  if (!req.body.data.status || req.body.data.status === "invalid") {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
  next();
}

function hasDeliverTo(req, res, next) {
  if (!req.body.data.deliverTo || req.body.data.deliverTo === "") {
    return next({
      status: 400,
      message: "Order must include a deliverTo",
    });
  }
  next();
}

function hasMobileNumber(req, res, next) {
  if (!req.body.data.mobileNumber || req.body.data.mobileNumber === "") {
    return next({
      status: 400,
      message: "Order must include a mobileNumber",
    });
  }
  next();
}

function hasDishes(req, res, next) {
  if (
    !req.body.data.dishes ||
    req.body.data.dishes.length === 0 ||
    !Array.isArray(req.body.data.dishes)
  ) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }
  next();
}

function dishesHaveQuantity(req, res, next) {
  //!req.body.data.dishes.every(dish => dish.quantity > 0)
  // console.log(req.body.data.dishes[0].quantity);
  //arr.findIndex(callback( element[, index[, array]] )[, thisArg]) findIndex returns index with no quantity
  let index = req.body.data.dishes.findIndex(
    (dish) =>
      dish.quantity <= 0 || !dish.quantity || typeof dish.quantity != "number"
  ); // finds an error, returns valid index(0 and up)if true, or -1 if falsy value
  if (index > -1) {
    // if an error was found
    return next({
      status: 400,
      message: `Dish ${index} must have a quantity that is an integer greater than 0`,
    });
  }
  next();
}

function isPending(req, res, next) {
  if (res.locals.order.status === "pending") {
    next();
  }
  return next({
    status: 400,
    message: "An order cannot be deleted unless it is pending",
  });
}

function isNotDelivered(req, res, next) {
  if (res.locals.order.status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  next();
}

// Route handler functions

function list(req, res, next) {
  let filteredOrders = [...orders];
  if (req.params.orderId) {
    filteredOrders = filteredOrders.filter(
      (order) => order.orderId === req.params.orderId
    );
  }
  res.json({ data: orders });
}

function create(req, res, next) {
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function update(req, res, next) {
  const { id } = res.locals.order;
  const updatedOrder = Object.assign(res.locals.order, req.body.data, { id });
  res.json({ data: updatedOrder });
}

function destroy(req, res, next) {
  const index = orders.findIndex((order) => order.id === res.locals.order);
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  orderIdExists,
  create: [isValidOrder, hasDishes, dishesHaveQuantity, create],
  read: [orderIdExists, read],
  update: [
    orderIdExists,
    routeIdMatchesOrderId,
    hasValidStatus,
    isNotDelivered,
    hasDeliverTo,
    hasMobileNumber,
    hasDishes,
    dishesHaveQuantity,
    update,
  ],
  delete: [orderIdExists, isPending, destroy],
};
