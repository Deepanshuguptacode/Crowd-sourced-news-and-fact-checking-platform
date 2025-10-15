const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

// Import models
const News = require('./models/News');
const { CommunityComment } = require('./models/Comments');
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');
const { CommentGroup, CommentFilter } = require('./models/CommentFilter');

// Target fake news articles based on our analysis
const TARGET_FAKE_NEWS = [
    '68ef91ef3bda87128d26e22c', // "Proof The Mainstream Media Is Manipulating The Election..."
    '68ef91ef3bda87128d26e22e', // "Charity: Clinton Foundation Distributed 'Watered-D..."
    '68ef91ef3bda87128d26e232', // "A Hillary Clinton Administration May be Entirely R..."
    '68ef91ef3bda87128d26e234', // "Trump's Latest Campaign Promise May Be His Most Ho..."
    '68ef91ef3bda87128d26e238'  // "Obama Pushes One World Government..."
];

// Comment templates for against stance (12 comments)
const AGAINST_COMMENT_TEMPLATES = [
    {
        template: "This article presents misleading information without credible sources. The claims made here have been debunked by multiple fact-checking organizations and lack any supporting evidence from reliable news outlets.",
        evidenceLinks: [
            { url: "https://www.snopes.com/fact-check/", explanation: "Snopes fact-checking reveals this claim as false with detailed analysis" },
            { url: "https://www.politifact.com/factchecks/", explanation: "PolitiFact rates similar claims as 'Pants on Fire' with comprehensive research" },
            { url: "https://www.factcheck.org/", explanation: "FactCheck.org provides detailed debunking with primary source verification" }
        ]
    },
    {
        template: "The sources cited in this article are questionable at best. Many of the claims contradict established facts and documented evidence. This appears to be a deliberate attempt to spread misinformation.",
        evidenceLinks: [
            { url: "https://www.reuters.com/fact-check/", explanation: "Reuters fact-check team confirms this information is inaccurate" },
            { url: "https://apnews.com/hub/ap-fact-check", explanation: "Associated Press fact-checking shows contradictory evidence" },
            { url: "https://www.washingtonpost.com/news/fact-checker/", explanation: "Washington Post fact-checker gives this claim four Pinocchios" }
        ]
    },
    {
        template: "This is a classic example of confirmation bias masquerading as journalism. The article cherry-picks data and ignores contradictory evidence to support a predetermined narrative.",
        evidenceLinks: [
            { url: "https://www.columbia.edu/~fdc/bibliography.html", explanation: "Columbia Journalism Review guidelines on avoiding bias in reporting" },
            { url: "https://www.poynter.org/reporting-editing/", explanation: "Poynter Institute best practices for ethical journalism contradicted here" },
            { url: "https://www.spj.org/ethicscode.asp", explanation: "Society of Professional Journalists ethics code violated by this reporting" }
        ]
    },
    {
        template: "The timeline presented in this article doesn't match documented historical events. Multiple primary sources contradict the sequence of events described here.",
        evidenceLinks: [
            { url: "https://www.archives.gov/", explanation: "National Archives records show different timeline than claimed" },
            { url: "https://www.congress.gov/", explanation: "Congressional records contradict the claims made in this article" },
            { url: "https://www.whitehouse.gov/briefings-statements/", explanation: "Official White House statements provide different account of events" }
        ]
    },
    {
        template: "This article lacks basic journalistic standards. No credible sources are quoted, and the claims made are unverifiable through standard fact-checking methods.",
        evidenceLinks: [
            { url: "https://ijnet.org/en/resource/journalism-ethics-guidelines", explanation: "International journalism ethics standards not followed in this piece" },
            { url: "https://www.rtdna.org/content/rtdna_coe", explanation: "Radio Television Digital News Association code of ethics violated" },
            { url: "https://www.niemanlab.org/", explanation: "Nieman Lab analysis shows this article fails basic verification standards" }
        ]
    },
    {
        template: "The statistical claims in this article are manipulated and taken out of context. The actual data tells a completely different story when properly analyzed.",
        evidenceLinks: [
            { url: "https://www.census.gov/", explanation: "US Census Bureau data contradicts the statistics presented in this article" },
            { url: "https://www.bls.gov/", explanation: "Bureau of Labor Statistics shows different numbers than those claimed" },
            { url: "https://data.gov/", explanation: "Official government data repositories provide accurate statistics that refute these claims" }
        ]
    },
    {
        template: "This piece relies heavily on conspiracy theories that have been thoroughly debunked. The author ignores established scientific consensus and expert analysis.",
        evidenceLinks: [
            { url: "https://www.nationalacademies.org/", explanation: "National Academy of Sciences reports contradict these conspiracy claims" },
            { url: "https://www.science.org/", explanation: "Peer-reviewed scientific research refutes the theories presented here" },
            { url: "https://www.nature.com/", explanation: "Nature journal publications provide evidence against these unfounded claims" }
        ]
    },
    {
        template: "The quotes attributed to public figures in this article appear to be taken out of context or completely fabricated. No verifiable source exists for these statements.",
        evidenceLinks: [
            { url: "https://www.c-span.org/", explanation: "C-SPAN archives show the actual statements made by these public figures" },
            { url: "https://www.presidency.ucsb.edu/", explanation: "American Presidency Project has no record of these alleged quotes" },
            { url: "https://www.govinfo.gov/", explanation: "Government Publishing Office records don't support these attributed statements" }
        ]
    },
    {
        template: "This article promotes dangerous misinformation that could harm public health and safety. The recommendations contradict established medical and scientific guidelines.",
        evidenceLinks: [
            { url: "https://www.cdc.gov/", explanation: "Centers for Disease Control guidelines directly contradict advice given in this article" },
            { url: "https://www.who.int/", explanation: "World Health Organization recommendations oppose the claims made here" },
            { url: "https://www.nih.gov/", explanation: "National Institutes of Health research refutes the medical claims presented" }
        ]
    },
    {
        template: "The economic analysis in this article is fundamentally flawed and ignores basic economic principles. Expert economists have criticized similar arguments extensively.",
        evidenceLinks: [
            { url: "https://www.federalreserve.gov/", explanation: "Federal Reserve data contradicts the economic claims made in this article" },
            { url: "https://www.imf.org/", explanation: "International Monetary Fund analysis shows different economic trends" },
            { url: "https://www.worldbank.org/", explanation: "World Bank reports provide accurate economic data that refutes these claims" }
        ]
    },
    {
        template: "This article demonstrates a clear lack of understanding of the legal framework surrounding the discussed issues. Legal experts have repeatedly clarified these misconceptions.",
        evidenceLinks: [
            { url: "https://www.supremecourt.gov/", explanation: "Supreme Court decisions contradict the legal interpretations presented" },
            { url: "https://www.law.cornell.edu/", explanation: "Cornell Law School analysis shows this legal reasoning is flawed" },
            { url: "https://www.americanbar.org/", explanation: "American Bar Association guidelines oppose the legal claims made here" }
        ]
    },
    {
        template: "The historical context provided in this article is inaccurate and misleading. Historians have extensively documented the actual events, which contradict this narrative.",
        evidenceLinks: [
            { url: "https://www.historians.org/", explanation: "American Historical Association fact-checking refutes these historical claims" },
            { url: "https://www.smithsonianmag.com/", explanation: "Smithsonian Institution archives provide accurate historical context" },
            { url: "https://www.loc.gov/", explanation: "Library of Congress records show different historical facts than presented" }
        ]
    }
];

// Comment templates for in favor stance (8 comments)
const IN_FAVOR_COMMENT_TEMPLATES = [
    {
        template: "This article raises important questions that deserve serious consideration. While some may disagree with the conclusions, the underlying concerns about transparency and accountability are valid.",
        evidenceLinks: [
            { url: "https://www.transparency.org/", explanation: "Transparency International reports support the need for greater accountability" },
            { url: "https://www.opensecrets.org/", explanation: "OpenSecrets data shows patterns that align with concerns raised in this article" },
            { url: "https://www.citizensforethics.org/", explanation: "Citizens for Responsibility and Ethics documents similar issues" }
        ]
    },
    {
        template: "The mainstream media often overlooks these perspectives. It's important to consider alternative viewpoints, even if they challenge conventional wisdom.",
        evidenceLinks: [
            { url: "https://fair.org/", explanation: "Fairness and Accuracy in Reporting documents media bias in coverage" },
            { url: "https://www.allsides.com/", explanation: "AllSides media bias chart shows need for diverse perspectives" },
            { url: "https://www.pewresearch.org/journalism/", explanation: "Pew Research shows public trust in media declining due to bias concerns" }
        ]
    },
    {
        template: "While I don't agree with everything here, this article does highlight some legitimate concerns that have been raised by credible sources in the past.",
        evidenceLinks: [
            { url: "https://www.propublica.org/", explanation: "ProPublica investigative reporting has raised similar concerns" },
            { url: "https://www.opensecrets.org/", explanation: "OpenSecrets tracking shows patterns that support some claims made" },
            { url: "https://www.followthemoney.org/", explanation: "Follow the Money database provides context for financial claims" }
        ]
    },
    {
        template: "This perspective, while controversial, represents views held by a significant portion of the population. Dismissing these concerns outright isn't constructive.",
        evidenceLinks: [
            { url: "https://www.pewresearch.org/", explanation: "Pew Research polling shows these views are held by substantial numbers of people" },
            { url: "https://www.gallup.com/", explanation: "Gallup polling data indicates widespread public concern about these issues" },
            { url: "https://www.publicpolicypolling.com/", explanation: "Public Policy Polling shows significant support for investigating these claims" }
        ]
    },
    {
        template: "The article raises questions about official narratives that deserve investigation. Healthy skepticism of authority is an important part of democratic discourse.",
        evidenceLinks: [
            { url: "https://www.brennancenter.org/", explanation: "Brennan Center for Justice supports the importance of government transparency" },
            { url: "https://www.aclu.org/", explanation: "ACLU advocacy for transparency aligns with article's call for accountability" },
            { url: "https://www.eff.org/", explanation: "Electronic Frontier Foundation supports citizen oversight of government activities" }
        ]
    },
    {
        template: "Some of the connections drawn here are thought-provoking, even if the conclusions are debatable. Independent research into these topics could be valuable.",
        evidenceLinks: [
            { url: "https://www.investigativereportingworkshop.org/", explanation: "Investigative Reporting Workshop emphasizes importance of independent research" },
            { url: "https://www.icij.org/", explanation: "International Consortium of Investigative Journalists supports thorough investigation" },
            { url: "https://www.revealnews.org/", explanation: "Reveal News emphasizes the value of following financial and political connections" }
        ]
    },
    {
        template: "While the tone may be inflammatory, this article does cite some concerning patterns that warrant further examination by qualified researchers.",
        evidenceLinks: [
            { url: "https://www.sunlightfoundation.com/", explanation: "Sunlight Foundation archived work supports need for pattern analysis in politics" },
            { url: "https://www.maplight.org/", explanation: "MapLight research shows importance of tracking political and financial connections" },
            { url: "https://www.opensecrets.org/", explanation: "OpenSecrets methodology supports examining financial patterns in politics" }
        ]
    },
    {
        template: "This article reflects genuine concerns shared by many citizens about institutional accountability. These concerns shouldn't be dismissed without proper investigation.",
        evidenceLinks: [
            { url: "https://www.edelman.com/trust-barometer", explanation: "Edelman Trust Barometer shows declining institutional trust among citizens" },
            { url: "https://www.pewresearch.org/politics/", explanation: "Pew Research documents widespread skepticism about institutional transparency" },
            { url: "https://www.gallup.com/poll/1597/confidence-institutions.aspx", explanation: "Gallup confidence in institutions polling supports need for greater accountability" }
        ]
    }
];

// Comment group templates (12 groups)
const COMMENT_GROUP_TEMPLATES = [
    { label: "Fact-Checking Discussion", description: "Comments focused on verifying claims and sources" },
    { label: "Source Credibility", description: "Comments analyzing the reliability of cited sources" },
    { label: "Bias Analysis", description: "Comments examining potential bias in reporting" },
    { label: "Historical Context", description: "Comments providing historical background and verification" },
    { label: "Statistical Verification", description: "Comments analyzing data and statistical claims" },
    { label: "Conspiracy Theory Analysis", description: "Comments addressing conspiracy-related content" },
    { label: "Quote Verification", description: "Comments checking attributed statements and quotes" },
    { label: "Health and Safety", description: "Comments addressing public health implications" },
    { label: "Economic Analysis", description: "Comments examining economic claims and data" },
    { label: "Legal Framework", description: "Comments analyzing legal aspects and interpretations" },
    { label: "Alternative Perspectives", description: "Comments supporting different viewpoints" },
    { label: "Accountability Discussion", description: "Comments focusing on transparency and oversight" }
];

class FakeNewsCommentGenerator {
    constructor() {
        this.communityUsers = [];
        this.expertUsers = [];
        this.outputDir = path.join(__dirname, '..', 'comment-data', 'fake-news-comments');
    }

    async initialize() {
        try {
            const mongoUri = process.env.MONGODB_URI;
            await mongoose.connect(mongoUri);
            console.log('✅ Connected to MongoDB Atlas successfully');

            // Load users
            this.communityUsers = await CommunityUser.find({});
            this.expertUsers = await ExpertUser.find({});

            console.log(`✅ Loaded ${this.communityUsers.length} community users`);
            console.log(`✅ Loaded ${this.expertUsers.length} expert users`);

            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            return false;
        }
    }

    getRandomUser() {
        return this.communityUsers[Math.floor(Math.random() * this.communityUsers.length)];
    }

    generateExpertVotes(stance) {
        const votes = [];
        const isAgainstStance = stance === 'against';
        
        this.expertUsers.forEach(expert => {
            // Against comments should get more upvotes (3+ requirement)
            const shouldUpvote = isAgainstStance ? Math.random() > 0.3 : Math.random() > 0.5;
            const voteType = shouldUpvote ? 'upvote' : 'downvote';
            
            const explanations = {
                upvote: [
                    "This comment provides valuable fact-checking with credible sources",
                    "Important analysis that helps readers understand the full context",
                    "Well-researched response that addresses key misconceptions",
                    "Provides necessary counter-perspective with solid evidence",
                    "Helpful clarification that adds to the discussion quality"
                ],
                downvote: [
                    "While this perspective exists, the evidence could be stronger",
                    "The argument has some merit but lacks comprehensive analysis",
                    "Valid concerns raised but more context would be helpful",
                    "Interesting viewpoint that deserves further investigation"
                ]
            };

            votes.push({
                expert: expert._id,
                voteType: voteType,
                explanation: explanations[voteType][Math.floor(Math.random() * explanations[voteType].length)],
                votedAt: new Date()
            });
        });

        return votes;
    }

    calculateScore(expertVotes) {
        const upvotes = expertVotes.filter(vote => vote.voteType === 'upvote').length;
        const downvotes = expertVotes.filter(vote => vote.voteType === 'downvote').length;
        return upvotes - downvotes;
    }

    async generateCommentsForNews(newsId) {
        console.log(`\n🔄 Generating comments for news: ${newsId}`);
        
        const comments = [];
        const newsInfo = await News.findById(newsId);
        
        if (!newsInfo) {
            console.log(`❌ News article not found: ${newsId}`);
            return null;
        }

        console.log(`📰 News: "${newsInfo.title?.substring(0, 60)}..."`);

        // Generate 12 against comments
        console.log('📝 Generating 12 AGAINST comments...');
        for (let i = 0; i < 12; i++) {
            const template = AGAINST_COMMENT_TEMPLATES[i];
            const commenter = this.getRandomUser();
            const expertVotes = this.generateExpertVotes('against');
            const score = this.calculateScore(expertVotes);

            const comment = {
                newsId: newsId,
                commenter: commenter._id,
                comment: template.template,
                evidenceLinks: template.evidenceLinks,
                expertVotes: expertVotes,
                upvoteCount: expertVotes.filter(v => v.voteType === 'upvote').length,
                downvoteCount: expertVotes.filter(v => v.voteType === 'downvote').length,
                stance: 'against',
                score: score,
                createdAt: new Date()
            };

            comments.push(comment);
            console.log(`   ✅ Against comment ${i + 1}: Score ${score}, Upvotes: ${comment.upvoteCount}`);
        }

        // Generate 8 in favor comments
        console.log('📝 Generating 8 IN_FAVOR comments...');
        for (let i = 0; i < 8; i++) {
            const template = IN_FAVOR_COMMENT_TEMPLATES[i];
            const commenter = this.getRandomUser();
            const expertVotes = this.generateExpertVotes('in_favor');
            const score = this.calculateScore(expertVotes);

            const comment = {
                newsId: newsId,
                commenter: commenter._id,
                comment: template.template,
                evidenceLinks: template.evidenceLinks,
                expertVotes: expertVotes,
                upvoteCount: expertVotes.filter(v => v.voteType === 'upvote').length,
                downvoteCount: expertVotes.filter(v => v.voteType === 'downvote').length,
                stance: 'in_favor',
                score: score,
                createdAt: new Date()
            };

            comments.push(comment);
            console.log(`   ✅ In favor comment ${i + 1}: Score ${score}, Upvotes: ${comment.upvoteCount}`);
        }

        return {
            newsId: newsId,
            newsTitle: newsInfo.title,
            comments: comments,
            statistics: {
                totalComments: comments.length,
                againstComments: comments.filter(c => c.stance === 'against').length,
                inFavorComments: comments.filter(c => c.stance === 'in_favor').length,
                averageScore: comments.reduce((sum, c) => sum + c.score, 0) / comments.length,
                totalExpertVotes: comments.reduce((sum, c) => sum + c.expertVotes.length, 0)
            }
        };
    }

    async saveToFile(data, filename) {
        const filePath = path.join(this.outputDir, filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(`📁 Saved: ${filename}`);
    }

    async processAllFakeNews() {
        console.log('🚀 STARTING FAKE NEWS COMMENT GENERATION\n');
        
        const results = [];
        
        for (const newsId of TARGET_FAKE_NEWS) {
            try {
                const commentData = await this.generateCommentsForNews(newsId);
                if (commentData) {
                    // Save individual news comments
                    await this.saveToFile(commentData, `news-${newsId}-comments.json`);
                    results.push(commentData);
                    
                    console.log(`✅ Completed: ${commentData.newsTitle?.substring(0, 50)}...`);
                    console.log(`   📊 Stats: ${commentData.statistics.totalComments} comments, Avg Score: ${commentData.statistics.averageScore.toFixed(1)}\n`);
                }
            } catch (error) {
                console.error(`❌ Error processing ${newsId}:`, error.message);
            }
        }

        // Save summary
        const summary = {
            totalNewsArticles: results.length,
            totalComments: results.reduce((sum, r) => sum + r.statistics.totalComments, 0),
            totalExpertVotes: results.reduce((sum, r) => sum + r.statistics.totalExpertVotes, 0),
            averageCommentsPerNews: results.reduce((sum, r) => sum + r.statistics.totalComments, 0) / results.length,
            generatedAt: new Date(),
            results: results.map(r => ({
                newsId: r.newsId,
                title: r.newsTitle,
                statistics: r.statistics
            }))
        };

        await this.saveToFile(summary, '../summary/generation-summary.json');
        
        console.log('🎉 COMMENT GENERATION COMPLETE!');
        console.log(`📊 Final Stats: ${summary.totalComments} comments across ${summary.totalNewsArticles} articles`);
        
        return results;
    }
}

// Execute if run directly
if (require.main === module) {
    async function main() {
        const generator = new FakeNewsCommentGenerator();
        if (await generator.initialize()) {
            await generator.processAllFakeNews();
        }
        await mongoose.connection.close();
        console.log('📁 Database connection closed');
    }
    
    main().catch(console.error);
}

module.exports = FakeNewsCommentGenerator;