'use strict'

const cloudinary = require('cloudinary');
const dotenv = require('dotenv');
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

exports.uploads = (file, folder) => {
    return new Promise(resolve => {
        cloudinary.uploader.upload(file, (result) => {
            resolve({
                url: result.url,
                id: result.public_id
            });
        }, {
            resource_type: 'auto',
            folder: folder
        });
    });
}
exports.delete = (file) => {
    cloudinary.api.delete_resources(file, (result) => { 
        console.log(result)
        if (result.deleted[file] === 'not_found') {
            cloudinary.api.delete_resources(file,
                function(result){console.log(result)}, { resource_type: "video" });
        }
    })

}