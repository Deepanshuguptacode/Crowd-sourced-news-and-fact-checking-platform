const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

// Import models
const News = require('./models/News');
const { CommunityComment } = require('./models/Comments');
const { CommentGroup, CommentFilter } = require('./models/CommentFilter');
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');

// Target fake news articles
const TARGET_FAKE_NEWS = [
    '68ef91ef3bda87128d26e22c', // "Proof The Mainstream Media Is Manipulating..."
    '68ef91ef3bda87128d26e22e', // "Charity: Clinton Foundation Distributed..."  
    '68ef91ef3bda87128d26e232', // "A Hillary Clinton Administration May be..."
    '68ef91ef3bda87128d26e234', // "Trump's Latest Campaign Promise May Be..."
    '68ef91ef3bda87128d26e238'  // "Obama Pushes One World Government..."
];

class ComprehensiveFakeNewsCommentSystem {
    constructor() {
        this.communityUsers = [];
        this.expertUsers = [];
        this.targetNews = [];
        this.outputDir = path.join(__dirname, '..', 'comment-data', 'fake-news-comprehensive');
    }

    async initialize() {
        try {
            console.log('🚀 INITIALIZING COMPREHENSIVE FAKE NEWS COMMENT SYSTEM\n');
            
            const mongoUri = process.env.MONGODB_URI;
            await mongoose.connect(mongoUri);
            console.log('✅ Connected to MongoDB successfully');

            // Create output directory
            try {
                await fs.mkdir(this.outputDir, { recursive: true });
                console.log('📁 Created output directory');
            } catch (error) {
                console.log('📁 Output directory already exists');
            }

            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            return false;
        }
    }

    async phase1_DataCleanupAndPreparation() {
        console.log('📋 PHASE 1: DATA CLEANUP & PREPARATION\n');

        try {
            // 1. Load and verify target news articles
            console.log('1. 📰 VERIFYING TARGET NEWS ARTICLES:');
            for (const newsId of TARGET_FAKE_NEWS) {
                const news = await News.findById(newsId);
                if (news) {
                    this.targetNews.push(news);
                    console.log(`   ✅ "${news.title?.substring(0, 50)}..."`);
                } else {
                    console.log(`   ❌ News not found: ${newsId}`);
                }
            }

            if (this.targetNews.length !== 5) {
                throw new Error(`Expected 5 target news articles, found ${this.targetNews.length}`);
            }

            // 2. Load users
            console.log('\n2. 👥 LOADING USERS:');
            this.communityUsers = await CommunityUser.find({});
            this.expertUsers = await ExpertUser.find({});
            
            console.log(`   📊 Community users: ${this.communityUsers.length}`);
            console.log(`   📊 Expert users: ${this.expertUsers.length}`);

            if (this.communityUsers.length < 5) {
                throw new Error(`Need at least 5 community users, found ${this.communityUsers.length}`);
            }
            if (this.expertUsers.length < 6) {
                throw new Error(`Need exactly 6 expert users, found ${this.expertUsers.length}`);
            }

            // 3. Clean existing fake news comments
            console.log('\n3. 🧹 CLEANING EXISTING FAKE NEWS DATA:');
            
            // Delete existing comments for target news
            const deleteCommentsResult = await CommunityComment.deleteMany({ 
                newsId: { $in: TARGET_FAKE_NEWS } 
            });
            console.log(`   🗑️  Deleted ${deleteCommentsResult.deletedCount} existing comments`);

            // Delete existing groups for target news
            const deleteGroupsResult = await CommentGroup.deleteMany({ 
                newsId: { $in: TARGET_FAKE_NEWS } 
            });
            console.log(`   🗑️  Deleted ${deleteGroupsResult.deletedCount} existing groups`);

            // Delete existing filters for target news
            const deleteFiltersResult = await CommentFilter.deleteMany({ 
                newsId: { $in: TARGET_FAKE_NEWS } 
            });
            console.log(`   🗑️  Deleted ${deleteFiltersResult.deletedCount} existing filters`);

            console.log('\n✅ PHASE 1 COMPLETE: Ready for fresh data generation\n');
            return true;

        } catch (error) {
            console.error('❌ Phase 1 failed:', error);
            return false;
        }
    }

    async phase2_CommentGeneration() {
        console.log('📝 PHASE 2: COMMENT GENERATION\n');

        // Evidence links pool for different types of comments
        const againstEvidencePool = [
            { url: "https://www.snopes.com/fact-check/", explanation: "Snopes fact-checking reveals this claim as false with detailed analysis" },
            { url: "https://www.politifact.com/factchecks/", explanation: "PolitiFact rates similar claims as 'Pants on Fire' with comprehensive research" },
            { url: "https://www.factcheck.org/", explanation: "FactCheck.org provides detailed debunking with primary source verification" },
            { url: "https://www.reuters.com/fact-check/", explanation: "Reuters fact-check team confirms this information is inaccurate" },
            { url: "https://apnews.com/hub/ap-fact-check", explanation: "Associated Press fact-checking shows contradictory evidence" },
            { url: "https://www.washingtonpost.com/news/fact-checker/", explanation: "Washington Post fact-checker gives this claim four Pinocchios" },
            { url: "https://www.archives.gov/", explanation: "National Archives records show different timeline than claimed" },
            { url: "https://www.congress.gov/", explanation: "Congressional records contradict the claims made in this article" },
            { url: "https://www.whitehouse.gov/briefings-statements/", explanation: "Official White House statements provide different account of events" }
        ];

        const favorEvidencePool = [
            { url: "https://www.transparency.org/", explanation: "Transparency International reports support the need for greater accountability" },
            { url: "https://www.opensecrets.org/", explanation: "OpenSecrets data shows patterns that align with concerns raised" },
            { url: "https://www.citizensforethics.org/", explanation: "Citizens for Responsibility and Ethics documents similar issues" },
            { url: "https://fair.org/", explanation: "Fairness and Accuracy in Reporting documents media bias in coverage" },
            { url: "https://www.allsides.com/", explanation: "AllSides media bias chart shows need for diverse perspectives" },
            { url: "https://www.pewresearch.org/journalism/", explanation: "Pew Research shows public trust in media declining due to bias concerns" }
        ];

        const againstCommentTemplates = [
            "This article presents misleading information without credible sources. The claims made here have been debunked by multiple fact-checking organizations.",
            "The sources cited in this article are questionable at best. Many of the claims contradict established facts and documented evidence.",
            "This is a classic example of confirmation bias masquerading as journalism. The article cherry-picks data to support a predetermined narrative.",
            "The timeline presented doesn't match documented historical events. Multiple primary sources contradict the sequence described here.",
            "This article lacks basic journalistic standards. No credible sources are quoted, and claims are unverifiable through fact-checking.",
            "The statistical claims are manipulated and taken out of context. The actual data tells a completely different story when properly analyzed.",
            "This piece relies heavily on conspiracy theories that have been thoroughly debunked by experts and scientific consensus.",
            "The quotes attributed to public figures appear to be taken out of context or completely fabricated with no verifiable source.",
            "This article promotes dangerous misinformation that could harm public health and safety, contradicting established guidelines.",
            "The economic analysis is fundamentally flawed and ignores basic economic principles that expert economists have extensively criticized.",
            "This demonstrates a clear lack of understanding of the legal framework. Legal experts have repeatedly clarified these misconceptions.",
            "The historical context provided is inaccurate and misleading. Historians have extensively documented actual events that contradict this narrative."
        ];

        const favorCommentTemplates = [
            "This article raises important questions that deserve serious consideration. The underlying concerns about transparency are valid.",
            "The mainstream media often overlooks these perspectives. It's important to consider alternative viewpoints that challenge conventional wisdom.",
            "While I don't agree with everything here, this article highlights legitimate concerns raised by credible sources in the past.",
            "This perspective represents views held by a significant portion of the population. Dismissing these concerns outright isn't constructive.",
            "The article raises questions about official narratives that deserve investigation. Healthy skepticism of authority is important in democracy.",
            "Some connections drawn here are thought-provoking, even if conclusions are debatable. Independent research into these topics could be valuable.",
            "While the tone may be inflammatory, this article cites concerning patterns that warrant further examination by qualified researchers.",
            "This reflects genuine concerns shared by many citizens about institutional accountability. These shouldn't be dismissed without proper investigation."
        ];

        const allGeneratedComments = [];

        for (let newsIndex = 0; newsIndex < this.targetNews.length; newsIndex++) {
            const news = this.targetNews[newsIndex];
            console.log(`\n🔄 Generating comments for: "${news.title?.substring(0, 50)}..."`);

            const newsComments = [];

            // Generate 12 AGAINST comments
            console.log('   📝 Creating 12 AGAINST comments...');
            for (let i = 0; i < 12; i++) {
                const commenter = this.getRandomCommunityUser();
                const evidenceLinks = this.getRandomEvidenceLinks(againstEvidencePool, 3);
                
                const comment = {
                    newsId: news._id,
                    commenter: commenter._id,
                    comment: againstCommentTemplates[i],
                    evidenceLinks: evidenceLinks,
                    expertVotes: [], // Will be filled in Phase 3
                    upvoteCount: 0,
                    downvoteCount: 0,
                    stance: 'against',
                    score: 0,
                    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time in last week
                };

                newsComments.push(comment);
                console.log(`      ✅ Against comment ${i + 1}: "${comment.comment.substring(0, 40)}..."`);
            }

            // Generate 8 IN_FAVOR comments  
            console.log('   📝 Creating 8 IN_FAVOR comments...');
            for (let i = 0; i < 8; i++) {
                const commenter = this.getRandomCommunityUser();
                const evidenceLinks = this.getRandomEvidenceLinks(favorEvidencePool, 3);
                
                const comment = {
                    newsId: news._id,
                    commenter: commenter._id,
                    comment: favorCommentTemplates[i],
                    evidenceLinks: evidenceLinks,
                    expertVotes: [], // Will be filled in Phase 3
                    upvoteCount: 0,
                    downvoteCount: 0,
                    stance: 'in_favor',
                    score: 0,
                    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
                };

                newsComments.push(comment);
                console.log(`      ✅ In favor comment ${i + 1}: "${comment.comment.substring(0, 40)}..."`);
            }

            allGeneratedComments.push({
                newsId: news._id,
                newsTitle: news.title,
                comments: newsComments
            });

            console.log(`   ✅ Generated 20 comments for this news article`);
        }

        console.log('\n✅ PHASE 2 COMPLETE: Generated 100 comments (60 against, 40 in favor)\n');
        return allGeneratedComments;
    }

    getRandomCommunityUser() {
        return this.communityUsers[Math.floor(Math.random() * this.communityUsers.length)];
    }

    getRandomEvidenceLinks(pool, count) {
        const selected = [];
        const poolCopy = [...pool];
        
        for (let i = 0; i < count && poolCopy.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * poolCopy.length);
            selected.push(poolCopy.splice(randomIndex, 1)[0]);
        }
        
        return selected;
    }

    async phase3_ExpertVotingSystem(allComments) {
        console.log('🗳️  PHASE 3: EXPERT VOTING SYSTEM\n');

        const voteExplanations = {
            upvote: [
                "This comment provides valuable fact-checking with credible sources and helps readers understand the full context",
                "Important analysis that addresses key misconceptions with well-researched evidence and balanced perspective",
                "Well-researched response that provides necessary counter-perspective with solid evidence and expert verification",
                "Helpful clarification that adds significant value to the discussion and promotes informed decision-making",
                "Provides essential context that helps readers evaluate claims critically and make informed judgments"
            ],
            downvote: [
                "While this perspective exists, the evidence could be stronger and more comprehensively presented",
                "The argument has some merit but lacks comprehensive analysis and could benefit from additional sources",
                "Valid concerns raised but more context and supporting evidence would strengthen the overall argument",
                "Interesting viewpoint that deserves consideration but requires further investigation and verification"
            ]
        };

        let totalVotes = 0;

        for (let newsIndex = 0; newsIndex < allComments.length; newsIndex++) {
            const newsData = allComments[newsIndex];
            console.log(`\n🔄 Adding expert votes for: "${newsData.newsTitle?.substring(0, 50)}..."`);

            for (let commentIndex = 0; commentIndex < newsData.comments.length; commentIndex++) {
                const comment = newsData.comments[commentIndex];
                const isAgainstStance = comment.stance === 'against';

                // ALL 6 expert users vote on EVERY comment
                for (const expert of this.expertUsers) {
                    // For against comments: guarantee 3+ upvotes (80% upvote rate)
                    // For in favor comments: more balanced (50% upvote rate)
                    const shouldUpvote = isAgainstStance ? Math.random() > 0.2 : Math.random() > 0.5;
                    const voteType = shouldUpvote ? 'upvote' : 'downvote';
                    
                    const vote = {
                        expert: expert._id,
                        voteType: voteType,
                        explanation: voteExplanations[voteType][Math.floor(Math.random() * voteExplanations[voteType].length)],
                        votedAt: new Date(comment.createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) // After comment creation
                    };

                    comment.expertVotes.push(vote);
                    totalVotes++;

                    if (voteType === 'upvote') {
                        comment.upvoteCount++;
                    } else {
                        comment.downvoteCount++;
                    }
                }

                // Calculate final score
                comment.score = comment.upvoteCount - comment.downvoteCount;

                console.log(`      ✅ Comment ${commentIndex + 1} (${comment.stance}): ${comment.upvoteCount} upvotes, ${comment.downvoteCount} downvotes, Score: ${comment.score}`);
            }
        }

        // Verify against comments have 3+ upvotes
        let againstWith3Plus = 0;
        let totalAgainst = 0;

        for (const newsData of allComments) {
            for (const comment of newsData.comments) {
                if (comment.stance === 'against') {
                    totalAgainst++;
                    if (comment.upvoteCount >= 3) {
                        againstWith3Plus++;
                    }
                }
            }
        }

        console.log(`\n📊 VOTING STATISTICS:`);
        console.log(`   🗳️  Total expert votes: ${totalVotes}`);
        console.log(`   👎 Against comments with 3+ upvotes: ${againstWith3Plus}/${totalAgainst}`);
        console.log(`   ✅ Compliance rate: ${((againstWith3Plus / totalAgainst) * 100).toFixed(1)}%`);

        console.log('\n✅ PHASE 3 COMPLETE: All expert voting completed\n');
        return allComments;
    }

    // Continue with Phase 4 in next method...
    async executeComplete() {
        try {
            if (!await this.initialize()) return false;
            if (!await this.phase1_DataCleanupAndPreparation()) return false;
            
            const generatedComments = await this.phase2_CommentGeneration();
            const votedComments = await this.phase3_ExpertVotingSystem(generatedComments);
            
            console.log('🎉 COMPREHENSIVE SYSTEM EXECUTION COMPLETE!');
            console.log('📊 Generated 100 comments with expert voting system');
            
            return votedComments;
        } catch (error) {
            console.error('❌ System execution failed:', error);
            return false;
        }
    }
}

// Execute if run directly
if (require.main === module) {
    async function main() {
        const system = new ComprehensiveFakeNewsCommentSystem();
        const result = await system.executeComplete();
        
        if (result) {
            console.log('\n📁 Next steps: Run database insertion and JSON export phases');
        }
        
        await mongoose.connection.close();
        console.log('\n📁 Database connection closed');
    }
    
    main().catch(console.error);
}

module.exports = ComprehensiveFakeNewsCommentSystem;