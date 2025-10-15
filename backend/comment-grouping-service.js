const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

// Import models
const { CommunityComment } = require('./models/Comments');
const { CommentGroup, CommentFilter } = require('./models/CommentFilter');

// Comment group templates (12 groups as specified)
const COMMENT_GROUP_TEMPLATES = [
    { 
        label: "Fact-Checking Discussion", 
        description: "Comments focused on verifying claims and sources",
        keywords: ["fact", "verify", "source", "credible", "evidence", "check"]
    },
    { 
        label: "Source Credibility Analysis", 
        description: "Comments analyzing the reliability and trustworthiness of cited sources",
        keywords: ["source", "credible", "reliable", "questionable", "citation"]
    },
    { 
        label: "Bias and Journalism Standards", 
        description: "Comments examining potential bias and journalistic ethics",
        keywords: ["bias", "journalism", "ethics", "standard", "narrative", "confirmation"]
    },
    { 
        label: "Historical Context Verification", 
        description: "Comments providing historical background and timeline verification",
        keywords: ["historical", "timeline", "context", "past", "documented", "archives"]
    },
    { 
        label: "Statistical Data Analysis", 
        description: "Comments analyzing numerical claims and statistical validity",
        keywords: ["statistical", "data", "numbers", "census", "percentage", "manipulated"]
    },
    { 
        label: "Conspiracy Theory Assessment", 
        description: "Comments addressing conspiracy-related content and debunking",
        keywords: ["conspiracy", "theory", "debunk", "scientific", "expert", "consensus"]
    },
    { 
        label: "Quote and Attribution Verification", 
        description: "Comments checking accuracy of quoted statements",
        keywords: ["quote", "attributed", "statement", "said", "claimed", "alleged"]
    },
    { 
        label: "Public Health and Safety Concerns", 
        description: "Comments addressing health implications and safety warnings",
        keywords: ["health", "safety", "medical", "dangerous", "harm", "guidelines"]
    },
    { 
        label: "Economic Claims Analysis", 
        description: "Comments examining economic data and financial claims",
        keywords: ["economic", "financial", "money", "market", "economy", "federal"]
    },
    { 
        label: "Legal Framework Discussion", 
        description: "Comments analyzing legal interpretations and frameworks",
        keywords: ["legal", "law", "court", "constitution", "rights", "supreme"]
    },
    { 
        label: "Alternative Perspectives", 
        description: "Comments presenting different viewpoints and considerations",
        keywords: ["perspective", "viewpoint", "consider", "alternative", "different", "mainstream"]
    },
    { 
        label: "Accountability and Transparency", 
        description: "Comments focusing on institutional accountability and transparency",
        keywords: ["accountability", "transparency", "institution", "government", "oversight", "citizen"]
    }
];

class CommentGroupingService {
    constructor() {
        this.commentDataDir = path.join(__dirname, '..', 'comment-data', 'fake-news-comments');
        this.summaryDir = path.join(__dirname, '..', 'comment-data', 'summary');
    }

    async initialize() {
        try {
            const mongoUri = process.env.MONGODB_URI;
            await mongoose.connect(mongoUri);
            console.log('✅ Connected to MongoDB Atlas successfully');
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            return false;
        }
    }

    // Simple keyword-based grouping algorithm
    assignCommentToGroup(commentText, commentStance) {
        const text = commentText.toLowerCase();
        const scores = [];

        // Calculate relevance score for each group
        COMMENT_GROUP_TEMPLATES.forEach((group, index) => {
            let score = 0;
            
            // Check keyword matches
            group.keywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    score += 2;
                }
            });

            // Boost scores based on stance and group type
            if (commentStance === 'against') {
                // Against comments favor fact-checking, bias analysis, etc.
                if (group.label.includes('Fact-Checking') || 
                    group.label.includes('Source Credibility') ||
                    group.label.includes('Bias') ||
                    group.label.includes('Verification')) {
                    score += 1;
                }
            } else {
                // In favor comments favor alternative perspectives, accountability
                if (group.label.includes('Alternative') || 
                    group.label.includes('Accountability') ||
                    group.label.includes('Transparency')) {
                    score += 1;
                }
            }

            scores.push({ groupIndex: index, score: score });
        });

        // Sort by score and return best match
        scores.sort((a, b) => b.score - a.score);
        
        // If no good match found, assign based on stance
        if (scores[0].score === 0) {
            if (commentStance === 'against') {
                return 0; // Fact-Checking Discussion
            } else {
                return 10; // Alternative Perspectives
            }
        }

        return scores[0].groupIndex;
    }

    async createCommentGroups(newsId, comments) {
        console.log(`\n📊 Creating comment groups for news: ${newsId}`);
        
        const groups = [];
        const commentGroupMap = new Map(); // Track which comments go to which groups

        // Initialize all 12 groups
        for (let i = 0; i < COMMENT_GROUP_TEMPLATES.length; i++) {
            const template = COMMENT_GROUP_TEMPLATES[i];
            
            const group = {
                label: template.label,
                description: template.description,
                newsId: newsId,
                embedding: [], // Simple implementation - could use actual embeddings
                comments: [],
                createdAt: new Date()
            };

            groups.push(group);
            commentGroupMap.set(i, []);
        }

        // Assign comments to groups
        comments.forEach((comment, commentIndex) => {
            const groupIndex = this.assignCommentToGroup(comment.comment, comment.stance);
            commentGroupMap.get(groupIndex).push(commentIndex);
            console.log(`   📝 Comment ${commentIndex + 1} (${comment.stance}) → Group: "${COMMENT_GROUP_TEMPLATES[groupIndex].label}"`);
        });

        // Distribute comments more evenly if needed
        this.balanceGroups(commentGroupMap, comments.length);

        // Update groups with comment assignments
        commentGroupMap.forEach((commentIndices, groupIndex) => {
            commentIndices.forEach(commentIndex => {
                groups[groupIndex].comments.push(comments[commentIndex]);
            });
        });

        // Filter out empty groups and ensure we have reasonable distribution
        const nonEmptyGroups = groups.filter(group => group.comments.length > 0);
        
        console.log(`   ✅ Created ${nonEmptyGroups.length} non-empty groups`);
        nonEmptyGroups.forEach((group, index) => {
            console.log(`      ${index + 1}. "${group.label}": ${group.comments.length} comments`);
        });

        return nonEmptyGroups;
    }

    balanceGroups(commentGroupMap, totalComments) {
        // Ensure no group is too large and distribute orphaned comments
        const maxPerGroup = Math.ceil(totalComments / 8); // Allow up to 8 active groups
        const minPerGroup = 1;

        // Move comments from overloaded groups to empty ones
        const emptyGroups = [];
        const overloadedGroups = [];

        commentGroupMap.forEach((comments, groupIndex) => {
            if (comments.length === 0) {
                emptyGroups.push(groupIndex);
            } else if (comments.length > maxPerGroup) {
                overloadedGroups.push(groupIndex);
            }
        });

        // Redistribute if needed
        overloadedGroups.forEach(overloadedIndex => {
            const comments = commentGroupMap.get(overloadedIndex);
            while (comments.length > maxPerGroup && emptyGroups.length > 0) {
                const targetGroup = emptyGroups.shift();
                const commentToMove = comments.pop();
                commentGroupMap.get(targetGroup).push(commentToMove);
            }
        });
    }

    async insertCommentsToDatabase(newsId, comments) {
        console.log(`\n💾 Inserting ${comments.length} comments to database for news: ${newsId}`);
        
        const insertedComments = [];
        
        for (let i = 0; i < comments.length; i++) {
            try {
                const comment = new CommunityComment(comments[i]);
                const savedComment = await comment.save();
                insertedComments.push(savedComment);
                
                if ((i + 1) % 5 === 0) {
                    console.log(`   ✅ Inserted ${i + 1}/${comments.length} comments`);
                }
            } catch (error) {
                console.error(`   ❌ Error inserting comment ${i + 1}:`, error.message);
            }
        }

        console.log(`   ✅ Successfully inserted ${insertedComments.length} comments`);
        return insertedComments;
    }

    async insertGroupsToDatabase(newsId, groups, insertedComments) {
        console.log(`\n📦 Inserting ${groups.length} comment groups to database`);
        
        const insertedGroups = [];
        
        for (let i = 0; i < groups.length; i++) {
            try {
                const group = groups[i];
                
                // Map comment objects to their database IDs
                const commentIds = group.comments.map(commentData => {
                    const matchingComment = insertedComments.find(inserted => 
                        inserted.comment === commentData.comment && 
                        inserted.stance === commentData.stance
                    );
                    return matchingComment ? matchingComment._id : null;
                }).filter(id => id !== null);

                const groupDoc = new CommentGroup({
                    label: group.label,
                    description: group.description,
                    newsId: newsId,
                    embedding: group.embedding,
                    comments: commentIds,
                    createdAt: group.createdAt
                });

                const savedGroup = await groupDoc.save();
                insertedGroups.push(savedGroup);
                
                console.log(`   ✅ Group ${i + 1}: "${group.label}" with ${commentIds.length} comments`);
            } catch (error) {
                console.error(`   ❌ Error inserting group ${i + 1}:`, error.message);
            }
        }

        console.log(`   ✅ Successfully inserted ${insertedGroups.length} groups`);
        return insertedGroups;
    }

    async createCommentFilters(insertedComments, insertedGroups) {
        console.log(`\n🔗 Creating comment filters for ${insertedComments.length} comments`);
        
        const filters = [];
        
        for (const comment of insertedComments) {
            try {
                // Find which group this comment belongs to
                const parentGroup = insertedGroups.find(group => 
                    group.comments.includes(comment._id)
                );

                if (parentGroup) {
                    const filter = new CommentFilter({
                        text: comment.comment,                    // Required field
                        originalCommentId: comment._id,           // Required field
                        commentType: 'community',                 // Required field - all our comments are community
                        newsId: comment.newsId,
                        groupId: parentGroup._id,
                        embedding: [], // Could add actual embeddings later
                        createdAt: new Date()
                    });

                    const savedFilter = await filter.save();
                    filters.push(savedFilter);
                } else {
                    console.log(`   ⚠️  No group found for comment: ${comment._id}`);
                }
            } catch (error) {
                console.error(`   ❌ Error creating filter for comment ${comment._id}:`, error.message);
            }
        }

        console.log(`   ✅ Created ${filters.length} comment filters`);
        return filters;
    }

    async saveGroupsToFile(newsId, groups, insertedGroups) {
        const groupsData = {
            newsId: newsId,
            totalGroups: groups.length,
            groups: insertedGroups.map(group => ({
                id: group._id,
                label: group.label,
                description: group.description,
                commentCount: group.comments.length,
                commentIds: group.comments
            })),
            createdAt: new Date()
        };

        const filename = `news-${newsId}-groups.json`;
        const filePath = path.join(this.commentDataDir, filename);
        await fs.writeFile(filePath, JSON.stringify(groupsData, null, 2));
        console.log(`📁 Saved groups: ${filename}`);
    }

    async saveFiltersToFile(newsId, filters) {
        const filtersData = {
            newsId: newsId,
            totalFilters: filters.length,
            filters: filters.map(filter => ({
                id: filter._id,
                text: filter.text,
                originalCommentId: filter.originalCommentId,
                commentType: filter.commentType,
                groupId: filter.groupId,
                newsId: filter.newsId
            })),
            createdAt: new Date()
        };

        const filename = `news-${newsId}-filters.json`;
        const filePath = path.join(this.commentDataDir, filename);
        await fs.writeFile(filePath, JSON.stringify(filtersData, null, 2));
        console.log(`📁 Saved filters: ${filename}`);
    }

    async processNewsArticle(newsId) {
        console.log(`\n🔄 Processing news article: ${newsId}`);
        
        try {
            // Read generated comments from file
            const commentsFile = path.join(this.commentDataDir, `news-${newsId}-comments.json`);
            const commentsData = JSON.parse(await fs.readFile(commentsFile, 'utf8'));
            
            console.log(`📖 Loaded ${commentsData.comments.length} comments from file`);

            // Step 1: Create comment groups
            const groups = await this.createCommentGroups(newsId, commentsData.comments);

            // Step 2: Insert comments to database
            const insertedComments = await this.insertCommentsToDatabase(newsId, commentsData.comments);

            // Step 3: Insert groups to database
            const insertedGroups = await this.insertGroupsToDatabase(newsId, groups, insertedComments);

            // Step 4: Create comment filters
            const filters = await this.createCommentFilters(insertedComments, insertedGroups);

            // Step 5: Save to files
            await this.saveGroupsToFile(newsId, groups, insertedGroups);
            await this.saveFiltersToFile(newsId, filters);

            console.log(`✅ Completed processing: ${commentsData.newsTitle?.substring(0, 50)}...`);
            console.log(`   📊 Database: ${insertedComments.length} comments, ${insertedGroups.length} groups, ${filters.length} filters`);

            return {
                newsId: newsId,
                newsTitle: commentsData.newsTitle,
                commentsCount: insertedComments.length,
                groupsCount: insertedGroups.length,
                filtersCount: filters.length,
                insertedComments: insertedComments,
                insertedGroups: insertedGroups,
                filters: filters
            };

        } catch (error) {
            console.error(`❌ Error processing news ${newsId}:`, error.message);
            return null;
        }
    }

    async processAllNews() {
        console.log('🚀 STARTING DATABASE INTEGRATION FOR ALL FAKE NEWS\n');
        
        const results = [];
        
        // Get list of generated comment files
        const files = await fs.readdir(this.commentDataDir);
        const commentFiles = files.filter(file => file.includes('-comments.json'));
        
        console.log(`📁 Found ${commentFiles.length} comment files to process`);

        for (const file of commentFiles) {
            const newsId = file.match(/news-(.+)-comments\.json/)[1];
            const result = await this.processNewsArticle(newsId);
            if (result) {
                results.push(result);
            }
        }

        // Save final summary
        const finalSummary = {
            totalNewsProcessed: results.length,
            totalCommentsInserted: results.reduce((sum, r) => sum + r.commentsCount, 0),
            totalGroupsCreated: results.reduce((sum, r) => sum + r.groupsCount, 0),
            totalFiltersCreated: results.reduce((sum, r) => sum + r.filtersCount, 0),
            processedAt: new Date(),
            results: results.map(r => ({
                newsId: r.newsId,
                newsTitle: r.newsTitle,
                commentsCount: r.commentsCount,
                groupsCount: r.groupsCount,
                filtersCount: r.filtersCount
            }))
        };

        const summaryPath = path.join(this.summaryDir, 'database-integration-summary.json');
        await fs.writeFile(summaryPath, JSON.stringify(finalSummary, null, 2));

        console.log('\n🎉 DATABASE INTEGRATION COMPLETE!');
        console.log(`📊 Final Stats:`);
        console.log(`   📰 News articles processed: ${finalSummary.totalNewsProcessed}`);
        console.log(`   💬 Total comments inserted: ${finalSummary.totalCommentsInserted}`);
        console.log(`   📦 Total groups created: ${finalSummary.totalGroupsCreated}`);
        console.log(`   🔗 Total filters created: ${finalSummary.totalFiltersCreated}`);

        return results;
    }
}

// Execute if run directly
if (require.main === module) {
    async function main() {
        const service = new CommentGroupingService();
        if (await service.initialize()) {
            await service.processAllNews();
        }
        await mongoose.connection.close();
        console.log('📁 Database connection closed');
    }
    
    main().catch(console.error);
}

module.exports = CommentGroupingService;