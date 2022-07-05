'use strict'

const mainController = {
    dashboard: (request, response) => {
        response.json({
            error: null,
            data: {
                title: 'It is a route protected',
                user: request.user
            }
        })
    }
}

module.exports = mainController;