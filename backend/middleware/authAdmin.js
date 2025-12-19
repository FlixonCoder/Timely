import jwt from 'jsonwebtoken'

const authAdmin = async (req, res, next) => {
    try {
        const { token } = req.headers
        if (!token) {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)

        if (token_decode.role !== 'admin' && token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) { // Fallback check or role check
            // Note: In adminController we signed with { email: email, role: 'admin' }
            // But for robustness let's just check if it decodes successfully and assuming we only issue this structure to admins.
            // Actually, the previous adminLogin simplified it. Let's stick to checking if it matches the admin email from env if we put it in payload, or just rely on the 'admin' role if we add it. 
            // Looking at adminController: const token = jwt.sign({ email: email, role: 'admin' }, ...

            if (token_decode.role !== 'admin') {
                return res.json({ success: false, message: 'Not Authorized Login Again' });
            }
        }

        next()
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default authAdmin
