# Module 02: MongoDB & Mongoose - Solutions

## Exercise 1: Basic User Schema with Validation

```javascript
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^.+@.+\..+$/, 'Please enter a valid email address']
  },
  age: {
    type: Number,
    min: [13, 'Must be at least 13 years old'],
    validate: {
      validator: function(v) {
        return v === undefined || v >= 13;
      },
      message: 'Age must be at least 13'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true  // Cannot be changed after creation
  }
});
```

**Key Points:**
- Use array syntax for custom error messages: `[validator, 'message']`
- `lowercase: true` normalizes emails for consistency
- `immutable: true` prevents createdAt from being modified
- Custom validator function for complex validation logic

---

## Exercise 2: Blog Schema with References

```javascript
const authorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  bio: { type: String, maxlength: 500 },
  avatarUrl: { type: String }
}, { timestamps: true });

const blogPostSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true 
  },
  content: { 
    type: String, 
    required: [true, 'Content is required'] 
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Author',
    required: true,
    index: true  // Index for faster author lookups
  },
  tags: [{ type: String, trim: true }],
  published: { 
    type: Boolean, 
    default: false,
    index: true  // Index for published filtering
  },
  publishedAt: { 
    type: Date,
    index: true  // Index for sorting by publish date
  },
  viewCount: { type: Number, default: 0 },
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }]
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  post: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'BlogPost',
    required: true,
    index: true  // Essential for finding post comments
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Author',
    required: true 
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 2000 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true  // Essential for sorting comments
  },
  parentComment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment',
    default: null,
    index: true  // For finding replies
  }
});

// Compound index for efficient post + date queries
commentSchema.index({ post: 1, createdAt: -1 });
```

**Design Decisions:**
- References (not embedding) for scalability - posts can have thousands of comments
- Index on `post` + `createdAt` for efficient "get post comments sorted by date"
- Self-referencing for nested comments (parentComment)
- Separate Author model to avoid data duplication

---

## Exercise 3: E-Commerce Schema Design

```javascript
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: 'text' },
  description: { type: String, required: true, index: 'text' },
  price: { 
    type: Number, 
    required: true, 
    min: 0,
    set: v => Math.round(v * 100) / 100  // Ensure 2 decimal places
  },
  category: { type: String, required: true, index: true },
  inventoryCount: { type: Number, required: true, min: 0, default: 0 },
  images: [{ type: String, validate: /^https?:\/\// }],
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    review: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true, toJSON: { virtuals: true } });

// Virtual for average rating
productSchema.virtual('averageRating').get(function() {
  if (!this.ratings || this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, r) => acc + r.score, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;  // 1 decimal
});

const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  items: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product',
      required: true
    },
    quantity: { type: Number, required: true, min: 1 },
    priceAtPurchase: { type: Number, required: true },  // Snapshot price
    name: String  // Product name at time of purchase
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  }
}, { timestamps: true });

// Calculate order total
orderSchema.methods.calculateTotal = function() {
  this.totalAmount = this.items.reduce((sum, item) => {
    return sum + (item.priceAtPurchase * item.quantity);
  }, 0);
  return this.totalAmount;
};

// Check product availability
orderSchema.methods.checkAvailability = async function() {
  const Product = mongoose.model('Product');
  
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (!product) throw new Error(`Product ${item.product} not found`);
    if (product.inventoryCount < item.quantity) {
      throw new Error(`Insufficient inventory for ${product.name}`);
    }
  }
  return true;
};

// Pre-save hook to set product snapshot info
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Product = mongoose.model('Product');
    
    for (const item of this.items) {
      const product = await Product.findById(item.product);
      if (product) {
        item.name = product.name;
        if (!item.priceAtPurchase) {
          item.priceAtPurchase = product.price;
        }
      }
    }
    
    this.calculateTotal();
  }
  next();
});
```

**Key Design Patterns:**
- Embedded shipping address (rarely shared, specific to order)
- Product snapshot in order items (prices change, orders need historical accuracy)
- Virtual for computed values (average rating)
- Pre-save hooks for data integrity

---

## Exercise 4: Soft Delete Implementation

```javascript
function addSoftDelete(schema) {
  // Add fields
  schema.add({
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
  });
  
  // Pre-find middleware - exclude deleted by default
  schema.pre('find', function(next) {
    if (!this.getQuery().hasOwnProperty('isDeleted')) {
      this.where({ isDeleted: false });
    }
    next();
  });
  
  schema.pre('findOne', function(next) {
    if (!this.getQuery().hasOwnProperty('isDeleted')) {
      this.where({ isDeleted: false });
    }
    next();
  });
  
  schema.pre('countDocuments', function(next) {
    if (!this.getQuery().hasOwnProperty('isDeleted')) {
      this.where({ isDeleted: false });
    }
    next();
  });
  
  // Instance method to soft delete
  schema.methods.softDelete = async function() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
  };
  
  // Instance method to restore
  schema.methods.restore = async function() {
    this.isDeleted = false;
    this.deletedAt = null;
    return this.save();
  };
  
  // Static method to find deleted documents
  schema.statics.findDeleted = function(filter = {}) {
    return this.find({ ...filter, isDeleted: true });
  };
  
  // Static method to find including deleted
  schema.statics.findWithDeleted = function(filter = {}) {
    return this.find({ ...filter }).setOptions({ overrideFilter: true });
  };
  
  // Override remove/delete to soft delete by default
  schema.methods.remove = schema.methods.softDelete;
  schema.methods.deleteOne = schema.methods.softDelete;
}

// Usage:
// addSoftDelete(userSchema);
// const user = await User.findById(id);
// await user.softDelete();  // Sets isDeleted: true
// await user.restore();     // Sets isDeleted: false
// await User.findDeleted(); // Find all soft-deleted
```

---

## Exercise 5: Query Implementations

```javascript
async function getPaginatedNews(page = 1, limit = 10, sortBy = 'createdAt') {
  const skip = (page - 1) * limit;
  
  // Build sort object
  const sortObj = {};
  if (sortBy === 'votes') {
    sortObj['votes.upvotes'] = -1;
  } else {
    sortObj[sortBy] = -1;
  }
  
  const [news, total] = await Promise.all([
    News.find()
      .populate('author', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    News.countDocuments()
  ]);
  
  return {
    news,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page
  };
}

async function getNewsWithComments(newsId) {
  return News.findById(newsId)
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: 'name avatar'
      },
      options: { sort: { createdAt: -1 } }
    })
    .populate('author', 'name email');
}

async function voteOnNews(newsId, userId, type) {
  const update = {};
  const opposite = type === 'up' ? 'downvotes' : 'upvotes';
  const target = type === 'up' ? 'upvotes' : 'downvotes';
  
  // Remove from opposite array if exists, add to target
  return News.findByIdAndUpdate(
    newsId,
    {
      $pull: { [`votes.${opposite}`]: userId },
      $addToSet: { [`votes.${target}`]: userId }
    },
    { new: true }
  );
}

async function getTrendingNews(limit = 10) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  return News.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $addFields: {
        voteScore: {
          $add: [
            { $size: { $ifNull: ['$votes.upvotes', []] } },
            { $divide: [{ $size: { $ifNull: ['$votes.downvotes', []] } }, 2] }
          ]
        }
      }
    },
    { $sort: { voteScore: -1, createdAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author',
        pipeline: [{ $project: { name: 1, email: 1 } }]
      }
    },
    { $unwind: '$author' }
  ]);
}

async function searchNews(query, limit = 20) {
  // Option 1: Text search (requires text index)
  // return News.find(
  //   { $text: { $search: query } },
  //   { score: { $meta: 'textScore' } }
  // )
  // .sort({ score: { $meta: 'textScore' } })
  // .limit(limit);
  
  // Option 2: Regex search (case-insensitive)
  const searchRegex = new RegExp(query, 'i');
  return News.find({
    $or: [
      { title: searchRegex },
      { description: searchRegex }
    ]
  })
  .select('title description author createdAt')
  .populate('author', 'name')
  .sort({ createdAt: -1 })
  .limit(limit);
}
```

---

## Exercise 6: Aggregation Pipeline

```javascript
async function getDailyCommentStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  return Comment.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        avgUpvotes: { $avg: { $size: '$upvotes' } },
        avgDownvotes: { $avg: { $size: '$downvotes' } }
      }
    },
    {
      $project: {
        date: '$_id',
        count: 1,
        avgVotes: { $add: ['$avgUpvotes', '$avgDownvotes'] },
        _id: 0
      }
    },
    { $sort: { date: 1 } }
  ]);
}

async function getTopContributors(limit = 10) {
  return Comment.aggregate([
    {
      $group: {
        _id: '$author',
        commentCount: { $sum: 1 },
        totalUpvotes: { $sum: { $size: '$upvotes' } }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
        pipeline: [{ $project: { name: 1, email: 1 } }]
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        user: 1,
        commentCount: 1,
        totalUpvotes: 1,
        score: { $add: ['$commentCount', { $divide: ['$totalUpvotes', 10] }] }
      }
    },
    { $sort: { score: -1 } },
    { $limit: limit }
  ]);
}

async function getMostEngagingNews(limit = 10) {
  return News.aggregate([
    {
      $lookup: {
        from: 'comments',
        localField: '_id',
        foreignField: 'newsId',
        as: 'comments'
      }
    },
    {
      $addFields: {
        upvoteCount: { $size: { $ifNull: ['$votes.upvotes', []] } },
        downvoteCount: { $size: { $ifNull: ['$votes.downvotes', []] } },
        commentCount: { $size: '$comments' }
      }
    },
    {
      $addFields: {
        engagementScore: {
          $add: [
            '$upvoteCount',
            '$downvoteCount',
            { $multiply: ['$commentCount', 2] }
          ]
        }
      }
    },
    { $sort: { engagementScore: -1 } },
    { $limit: limit },
    {
      $project: {
        title: 1,
        author: 1,
        engagementScore: 1,
        upvoteCount: 1,
        downvoteCount: 1,
        commentCount: 1
      }
    }
  ]);
}
```

---

## Exercise 7: Transaction Implementation

```javascript
async function transferCredits(fromUserId, toUserId, amount) {
  if (amount <= 0) throw new Error('Amount must be positive');
  if (fromUserId === toUserId) throw new Error('Cannot transfer to yourself');
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get sender with session
    const sender = await User.findById(fromUserId).session(session);
    if (!sender) throw new Error('Sender not found');
    if (sender.balance < amount) throw new Error('Insufficient balance');
    
    // Get receiver with session
    const receiver = await User.findById(toUserId).session(session);
    if (!receiver) throw new Error('Receiver not found');
    
    // Update balances
    sender.balance -= amount;
    receiver.balance += amount;
    
    await sender.save({ session });
    await receiver.save({ session });
    
    // Create transaction record
    const transaction = await Transaction.create([{
      from: fromUserId,
      to: toUserId,
      amount,
      type: 'transfer',
      status: 'completed'
    }], { session });
    
    await session.commitTransaction();
    return transaction[0];
    
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

## Exercise 8: Index Design

```javascript
function addIndexesToSchemas() {
  // 1. Find news by status and sort by createdAt
  // Compound index: status first (equality), then createdAt (sort)
  newsSchema.index({ status: 1, createdAt: -1 });
  
  // 2. Find comments by newsId and sort by createdAt
  commentSchema.index({ newsId: 1, createdAt: -1 });
  
  // 3. Find user by email (unique lookup)
  userSchema.index({ email: 1 }, { unique: true });
  
  // 4. Text search across title and description
  newsSchema.index({ title: 'text', description: 'text' }, {
    weights: {
      title: 10,      // Title matches are more important
      description: 5
    },
    name: 'news_text_index'
  });
  
  // 5. Find news by userId and status
  newsSchema.index({ userId: 1, status: 1 });
  
  // Bonus: Partial index for pending news (smaller, faster)
  newsSchema.index(
    { createdAt: -1 },
    { 
      partialFilterExpression: { status: 'pending' },
      name: 'pending_news_index'
    }
  );
}
```

**Index Selection Principles:**
- Equality fields first, then sort fields, then range fields
- Unique indexes automatically prevent duplicates
- Text indexes for search functionality
- Partial indexes for queries on subsets of data
