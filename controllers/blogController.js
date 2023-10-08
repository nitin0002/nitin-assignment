import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import axios from 'axios';
import _ from 'lodash';

const cache = {};

export const blogStatsFetch = catchAsyncError(async (req, res, next) => {
    try {

        if (cache.blogStatsFetch) {
            console.log('Returning cached blog stats');
            res.status(200).json(cache.blogStatsFetch);
            return;
        }

        const response = await axios.get(process.env.PERSONAL_API, {
            headers: {
                'x-hasura-admin-secret': process.env.ADMIN_SECRET,
            },
        });

        const responseData = response.data.blogs;

        const totalBlogs = _.size(responseData);
        const blogWithLongestTitle = _.maxBy(responseData, blog => blog.title.length);
        const blogsWithPrivacyTitle = _.filter(responseData, blog =>
            _.includes(_.toLower(blog.title), 'privacy')
        ).length;
        const uniqueBlogTitles = _.uniqBy(responseData, (blog) => blog.title.toLowerCase()).map((blog) => blog.title);

        const stats = {
            totalNumberOfBlogs: totalBlogs,
            blogWithLongestTitle: blogWithLongestTitle.title,
            numberOfBlogsWithPrivacyTitle: blogsWithPrivacyTitle,
            uniqueBlogTitles: uniqueBlogTitles,
        };

        cache.blogStatsFetch = stats;

        console.log('Fetching and caching blog stats');
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching data:', error);
        next(new ErrorHandler(500, 'Error fetching data'));
    }
});

export const blogFilter = catchAsyncError(async (req, res, next) => {
    const searchQuery = req.query.query;
    try {
        if (cache.blogFilter && cache.blogFilter[searchQuery]) {
            console.log('Returning cached search results');
            res.status(200).json(cache.blogFilter[searchQuery]);
            return;
        }

        const response = await axios.get(process.env.PERSONAL_API, {
            headers: {
                'x-hasura-admin-secret': process.env.ADMIN_SECRET,
            },
        });

        const responseData = response.data.blogs;

        const filteredData = searchQuery
            ? responseData.filter(blog =>
                _.includes(_.toLower(blog.title), _.toLower(searchQuery))
            )
            : responseData;

        if (!cache.blogFilter) {
            cache.blogFilter = {};
        }
        cache.blogFilter[searchQuery] = {
            data: filteredData,
        };

        console.log('Fetching and caching search results');
        res.status(200).json(cache.blogFilter[searchQuery]);
    } catch (error) {
        console.error('Error fetching data:', error);
        next(new ErrorHandler(500, 'Error fetching data'));
    }
});
