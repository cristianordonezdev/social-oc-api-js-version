'use strict'

const verifyLoggedUser = (request, response, next) => {
  if (request.user.uuid === request.body.user_uuid) { 
    next();
  } else {
    return response.status(401).json({error: 'Access denied'});
  }
}
module.exports = verifyLoggedUser;