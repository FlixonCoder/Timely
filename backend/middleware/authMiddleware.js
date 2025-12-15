import jwt from 'jsonwebtoken';

const authUser = async (req, res, next) => {
    try {
        const { token, authorization } = req.headers;

        // Allow both 'token' header and 'Authorization: Bearer ...' for backward compatibility or transition
        let extractedToken = token;

        if (!extractedToken && authorization && authorization.startsWith('Bearer ')) {
            extractedToken = authorization.split(' ')[1];
        }

        if (!extractedToken) {
            return res.json({ success: false, message: 'Not Authorized Login Again' });
        }

        const token_decode = jwt.verify(extractedToken, process.env.JWT_SECRET);

        // Attach to req object (preferred)
        req.userId = token_decode.id;

        // Attach to req.body for backward compatibility (if body exists)
        if (req.body) {
            req.body.userId = token_decode.id;
        }

        next();

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export default authUser;
