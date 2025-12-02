// ==================== WARNING ROUTES ====================
// Add these routes to users.js before "module.exports = router;"

// File upload storage for warning attachments
const warningsDir = path.join(__dirname, '..', 'uploads', 'warnings');
if (!fs.existsSync(warningsDir)) {
    fs.mkdirSync(warningsDir, { recursive: true });
}

const warningStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, warningsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `warning-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        cb(null, uniqueName);
    }
});

const warningUpload = multer({
    storage: warningStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, JPG, and PNG files are allowed for warning attachments.'));
        }
    }
});

// @route   POST /api/users/:userId/warning
// @desc    Send warning to user with optional attachment
// @access  Private (Admin only)
router.post('/:userId/warning', authenticateToken, requireAdmin, warningUpload.single('attachment'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { message } = req.body;

        console.log('📢 Creating warning for user:', userId);
        console.log('Message:', message);
        console.log('File:', req.file);

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Warning message is required'
            });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User does not exist'
            });
        }

        const Warning = require('../models/Warning');

        // Create warning document
        const warning = new Warning({
            userId: userId,
            type: 'warning',
            title: 'Warning Notice',
            description: message,
            severity: 'medium',
            status: 'active',
            issuedBy: req.user._id,
            issuedAt: new Date(),
            metadata: {
                attachmentUrl: req.file ? `/uploads/warnings/${req.file.filename}` : null
            }
        });

        await warning.save();

        console.log('✅ Warning created:', warning._id);

        res.status(201).json({
            success: true,
            message: 'Warning sent successfully',
            warning: {
                _id: warning._id,
                userId: warning.userId,
                title: warning.title,
                description: warning.description,
                severity: warning.severity,
                status: warning.status,
                issuedAt: warning.issuedAt,
                metadata: warning.metadata
            }
        });

    } catch (error) {
        console.error('Send warning error:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Error sending warning',
            details: error.message
        });
    }
});

// @route   GET /api/users/:userId/warnings
// @desc    Get all warnings for a user
// @access  Private (Admin or same user)
router.get('/:userId/warnings', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user can access this data
        if (req.user.userType !== 'admin' && req.user._id.toString() !== userId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Access denied'
            });
        }

        const Warning = require('../models/Warning');

        const warnings = await Warning.find({ userId: userId })
            .populate('issuedBy', 'name email')
            .sort({ issuedAt: -1 });

        console.log(`📋 Found ${warnings.length} warnings for user ${userId}`);

        res.json({
            success: true,
            warnings: warnings
        });

    } catch (error) {
        console.error('Get warnings error:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Error fetching warnings',
            details: error.message
        });
    }
});
