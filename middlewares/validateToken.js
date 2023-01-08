'use strict'

const jwb = require('jsonwebtoken');

const verifyToken = (request, response, next) => {
    const token = request.header('auth-token');
    if (!token) return response.status(401).json({error: 'Access denied'})
    try {
        const verified = jwb.verify(token, process.env.TOKEN_SECRET);
        request.user = verified;
        next();
    } catch (error) {
        response.status(400).json({error: 'Token in not valid, access denied'});
    }
}

module.exports = verifyToken;