const express = require('express');
const router = express.Router();

const { requireAuth } = require('../../utils/auth.js');
const { User, Spot, SpotImage, Booking, Review, ReviewImage, sequelize } = require('../../db/models');

const { next } = require('cli');
const spot = require('../../db/models/spot.js');



// Get all Spots
router.get('/', async (req, res) => {
    const allSpots = await Spot.findAll();

});



// const spots = await Spot.findAll({
//     attributes: {
//         include: [
//             [sequelize.literal(`(
//                 SELECT AVG(stars)
//                 FROM reviews AS review
//                 WHERE review.spotId = spot.id
//                 )`),
//                 'avgRating'
//             ],
//             [sequelize.literal(`(
//                     SELECT url
//                 FROM spotImages AS spotImage
//                 WHERE spotImage.spotId = spot.id
//                 AND preview = true
//                 )`),
//                 'previewImage'
//             ]
//         ]
//     }
// })

// res.json({
//     Spots: spots
// })


// Get all Spots owned by the Current User --- Done!!!
router.get('/current', requireAuth, async (req, res) => {
    const spots = await Spot.findAll({ where: { ownerId: req.user.id }, raw: true });

    for (let spot of spots) {
        const images = await SpotImage.findAll({ where: { spotId: spot.id }, raw: true });


        if (images) {
            for (let image of images) {
                if (image.preview === true || image.preview === 1) {
                    spot.previewImage = image.url;
                }
            }
            if (!spot.previewImage) {
                spot.previewImage = null;
            }
        }

        const reviewCount = await Review.count({ where: { spotId: spot.id } });
        const totalStars = await Review.sum('stars', { where: { spotId: spot.id } });

        spot.avgRating = parseInt(totalStars / reviewCount);
    }
    res.json({ Spots: spots })
})



// Get details of a Spot from an id --- DONE!!!
router.get('/:spotId', async (req, res) => {

    const spot = await Spot.findByPk(req.params.spotId, {
        include: [
            {
                model: SpotImage,
                attributes: ['id', 'url', 'preview'],
                as: 'SpotImages'
            },
            {
                model: User,
                as: 'Owner',
                attributes: ['id', 'firstName', 'lastName']
            }
        ]
    });

    if (!spot) {
        return res.status(404).json({
            message: "Spot couldn't be found",
            statusCode: 404
        })
    }

    return res.json(spot);
})





// Create a Spot --- DONE!!!
router.post('/', requireAuth, async (req, res) => {
    const { address, city, state, country, lat, lng, name, description, price } = req.body;

    if (address && city && state && country && lat && lng && name && description && price) {
        const newSpot = await Spot.create({
            ownerId: req.user.id,
            address,
            city,
            state,
            country,
            lat,
            lng,
            name,
            description,
            price
        })
        res.status(201).json(newSpot);

    } else {
        const errors = {};

        if (!address) errors.address = "Street address is required";
        if (!city) errors.city = "City is required";
        if (!state) errors.state = "State is required";
        if (!country) errors.country = "Country is required";
        if (!lat) errors.lat = "Latitude is not valid";
        if (!lng) errors.lng = "Longitude is not valid";
        if (!name) errors.name = "Name must be less than 50 characters";
        if (!description) errors.description = "Description is required";
        if (!price) errors.price = "Price per day is required";

        return res.status(400).json({
            message: "Validation Error",
            statusCode: 400,
            errors
        })
    }
})




// Add an Image to a Spot based on the Spot's id ---- DONE!!!
router.post('/:spotId/images', requireAuth, async (req, res) => {
    const { url, preview } = req.body;
    // const { spotId } = req.params;
    // console.log(spotId)

    const spot = await Spot.findOne({
        where: { id: parseInt(req.params.spotId, 10) }
    })

    if (spot) {
        const spotImage = await SpotImage.create({
            spotId: parseInt(req.params.spotId, 10),
            url: url
            // preview: preview
        })

        const spotImageResponse = {};
        spotImageResponse.id = spotImage.id,
            spotImageResponse.url = spotImage.url,
            // spotImageResponse.preview = spotImage.preview;

            res.json(spotImageResponse)

    } else {
        res.status(404).json({
            message: "Spot couldn't be found",
            statusCode: 404
        })
    }
})


// if (address) spot.address = address;
// if (city) spot.city = city;
// if (state) spot.state = state;
// if (country) spot.country = country;
// if (lat) spot.lat = lat;
// if (lng) spot.lng = lng;
// if (name) spot.name = name;
// if (description) spot.description = description;
// if (price) spot.price = price;


// Edit a Spot --- DONE!!!!
router.put('/:spotId', requireAuth, async (req, res) => {
    const { address, city, state, country, lat, lng, name, description, price } = req.body;

    const spot = await Spot.findByPk(req.params.spotId);

    if (!spot) {
        return res.status(404).json({
            message: "Spot couldn't be found",
            statusCode: 404
        })
    }

    if (spot.ownerId === req.user.id) {
        if (address && city && state && country && lat && lng && name && description && price) {
            spot.address = address;
            spot.city = city;
            spot.state = state;
            spot.country = country;
            spot.lat = lat;
            spot.lng = lng;
            spot.name = name;
            spot.description = description;
            spot.price = price;

            await spot.save();
            return res.json(spot);

        } else if (spot.ownerId !== req.user.id) {
            return res.status(404).json({
                message: "You do not have authorization to edit this spot",
                statusCode: 400
            })

        } else {
            const errors = {};

            if (!address) errors.address = "Street address is required";
            if (!city) errors.city = "City is required";
            if (!state) errors.state = "State is required";
            if (!country) errors.country = "Country is required";
            if (!lat) errors.lat = "Latitude is not valid";
            if (!lng) errors.lng = "Longitude is not valid";
            if (!name) errors.name = "Name must be less than 50 characters";
            if (!description) errors.description = "Description is required";
            if (!price) errors.price = "Price per day is required";

            return res.status(400).json({
                message: "Validation Error",
                statusCode: 400,
                errors
            })
        }
    }
})



// Delete a Spot --- DONE!!!
router.delete('/:spotId', requireAuth, async (req, res) => {
    const spot = await Spot.findByPk(req.params.spotId);

    if (!spot) {
        return res.status(404)
            .json({
                message: "Spot couldn't be found",
                statusCode: 404
            })
    }

    if (spot.ownerId !== req.user.id) {
        return res.status(404).json({
            message: "You need proper authorization to delete this spot"
        })
    }

    await spot.destroy();

    return res.json({
        message: "Successfully deleted",
        statusCode: 200
    })
})



// Get all Reviews by a Spot's id
router.get('/:spotId/reviews', async (req, res) => {

})



// Create a Review for a Spot based on the Spot's id --- DONE!!!
router.post('/:spotId/reviews', requireAuth, async (req, res) => {
    const { review, stars } = req.body;

    const spot = await Spot.findByPk(req.params.spotId);

    if (spot) {
        const reviews = await Review.findAll({
            where: {
                spotId: req.params.spotId
            }
        })

        for (let review of reviews) {
            if (review.userId === req.user.id) {
                return res.status(403).json({
                    message: "User already has a review for this spot",
                    statusCode: 403
                })
            }
        }
    }

    if (spot && review && stars) {
        const newReview = await Review.create({
            userId: req.user.id,
            spotId: req.params.spotId,
            review,
            stars,
        })

        return res.status(201).json(newReview)

    } else if (!spot) {
        return res.status(404).json({
            message: "Spot couldn't be found",
            statusCode: 404
        })

    } else {
        const errors = {};

        if (!review) errors.review = "Review text is required";
        if (!stars) errors.stars = "Stars must be an integer from 1 to 5";

        return res.status(400).json({
            message: "Validation error",
            statusCode: 400,
            errors
        })
    }
})




// Get all Bookings for a Spot based on the Spot's id
router.get('/:spotId/bookings', requireAuth, async (req, res) => {

})




// Create a Booking from a Spot based on the Spot's id
router.post('/:spotId/bookings', requireAuth, async (req, res) => {

})






module.exports = router