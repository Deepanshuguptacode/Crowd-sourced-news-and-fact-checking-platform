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

class FinalVerificationReport {
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

    async generateCompleteReport() {
        console.log('📋 GENERATING FINAL VERIFICATION REPORT\n');

        const report = {
            timestamp: new Date(),
            summary: {},
            details: {},
            verification: {},
            statistics: {}
        };

        try {
            // 1. News Articles Analysis
            console.log('1. 📰 ANALYZING NEWS ARTICLES...');
            const allNews = await News.find({});
            const fakeNewsTargets = [
                '68ef91ef3bda87128d26e22c',
                '68ef91ef3bda87128d26e22e', 
                '68ef91ef3bda87128d26e232',
                '68ef91ef3bda87128d26e234',
                '68ef91ef3bda87128d26e238'
            ];

            const targetNews = await News.find({ _id: { $in: fakeNewsTargets } });
            
            console.log(`   📊 Total news articles: ${allNews.length}`);
            console.log(`   🎯 Target fake news: ${targetNews.length}`);
            
            report.details.news = {
                totalNews: allNews.length,
                targetFakeNews: targetNews.length,
                processedNews: targetNews.map(news => ({
                    id: news._id,
                    title: news.title,
                    uploader: news.uploader
                }))
            };

            // 2. Comments Analysis
            console.log('\n2. 💬 ANALYZING COMMENTS...');
            const totalComments = await CommunityComment.countDocuments();
            const recentComments = await CommunityComment.find({
                newsId: { $in: fakeNewsTargets }
            }).populate('commenter').populate('newsId');

            const againstComments = recentComments.filter(c => c.stance === 'against');
            const inFavorComments = recentComments.filter(c => c.stance === 'in_favor');
            
            // Check expert voting requirement (against comments need 3+ upvotes)
            const againstCommentsWithUpvotes = againstComments.filter(c => c.upvoteCount >= 3);
            
            console.log(`   📊 Total comments across all news: ${totalComments}`);
            console.log(`   🎯 Comments on target fake news: ${recentComments.length}`);
            console.log(`   👎 Against comments: ${againstComments.length}`);
            console.log(`   👍 In favor comments: ${inFavorComments.length}`);
            console.log(`   ✅ Against comments with 3+ upvotes: ${againstCommentsWithUpvotes.length}/${againstComments.length}`);

            report.details.comments = {
                totalComments: totalComments,
                targetNewsComments: recentComments.length,
                againstComments: againstComments.length,
                inFavorComments: inFavorComments.length,
                againstCommentsWithRequiredUpvotes: againstCommentsWithUpvotes.length,
                upvoteRequirementMet: againstCommentsWithUpvotes.length === againstComments.length
            };

            // 3. Comment Groups Analysis
            console.log('\n3. 📦 ANALYZING COMMENT GROUPS...');
            const totalGroups = await CommentGroup.countDocuments();
            const targetGroups = await CommentGroup.find({
                newsId: { $in: fakeNewsTargets }
            }).populate('comments');

            const groupsWithComments = targetGroups.filter(g => g.comments.length > 0);
            
            console.log(`   📊 Total comment groups: ${totalGroups}`);
            console.log(`   🎯 Groups for target news: ${targetGroups.length}`);
            console.log(`   ✅ Groups with comments: ${groupsWithComments.length}`);

            // Group distribution analysis
            const groupDistribution = {};
            targetGroups.forEach(group => {
                groupDistribution[group.label] = (groupDistribution[group.label] || 0) + group.comments.length;
            });

            report.details.groups = {
                totalGroups: totalGroups,
                targetNewsGroups: targetGroups.length,
                groupsWithComments: groupsWithComments.length,
                groupDistribution: groupDistribution
            };

            // 4. Comment Filters Analysis
            console.log('\n4. 🔗 ANALYZING COMMENT FILTERS...');
            const totalFilters = await CommentFilter.countDocuments();
            const targetFilters = await CommentFilter.find({
                newsId: { $in: fakeNewsTargets }
            });

            console.log(`   📊 Total comment filters: ${totalFilters}`);
            console.log(`   🎯 Filters for target news: ${targetFilters.length}`);

            report.details.filters = {
                totalFilters: totalFilters,
                targetNewsFilters: targetFilters.length,
                filterCommentMapping: targetFilters.length === recentComments.length
            };

            // 5. Users Analysis
            console.log('\n5. 👥 ANALYZING USERS...');
            const communityUsers = await CommunityUser.find({});
            const expertUsers = await ExpertUser.find({});

            console.log(`   👥 Community users: ${communityUsers.length}`);
            console.log(`   🎓 Expert users: ${expertUsers.length}`);

            report.details.users = {
                communityUsers: communityUsers.length,
                expertUsers: expertUsers.length
            };

            // 6. Evidence Links Analysis
            console.log('\n6. 🔗 ANALYZING EVIDENCE LINKS...');
            let totalEvidenceLinks = 0;
            recentComments.forEach(comment => {
                totalEvidenceLinks += comment.evidenceLinks ? comment.evidenceLinks.length : 0;
            });

            console.log(`   🔗 Total evidence links: ${totalEvidenceLinks}`);
            console.log(`   📊 Average links per comment: ${(totalEvidenceLinks / recentComments.length).toFixed(1)}`);

            report.details.evidence = {
                totalEvidenceLinks: totalEvidenceLinks,
                averageLinksPerComment: totalEvidenceLinks / recentComments.length
            };

            // 7. Expert Voting Analysis
            console.log('\n7. 📊 ANALYZING EXPERT VOTING...');
            let totalExpertVotes = 0;
            let totalUpvotes = 0;
            let totalDownvotes = 0;

            recentComments.forEach(comment => {
                if (comment.expertVotes) {
                    totalExpertVotes += comment.expertVotes.length;
                    totalUpvotes += comment.expertVotes.filter(v => v.voteType === 'upvote').length;
                    totalDownvotes += comment.expertVotes.filter(v => v.voteType === 'downvote').length;
                }
            });

            console.log(`   🗳️  Total expert votes: ${totalExpertVotes}`);
            console.log(`   👍 Total upvotes: ${totalUpvotes}`);
            console.log(`   👎 Total downvotes: ${totalDownvotes}`);
            console.log(`   📊 Expected votes (6 experts × ${recentComments.length} comments): ${expertUsers.length * recentComments.length}`);

            report.details.expertVoting = {
                totalExpertVotes: totalExpertVotes,
                totalUpvotes: totalUpvotes,
                totalDownvotes: totalDownvotes,
                expectedVotes: expertUsers.length * recentComments.length,
                votingComplete: totalExpertVotes === (expertUsers.length * recentComments.length)
            };

            // 8. Requirements Verification
            console.log('\n8. ✅ VERIFYING REQUIREMENTS...');
            
            const requirements = {
                '20CommentsPerNews': recentComments.length === (fakeNewsTargets.length * 20),
                '12AgainstComments': againstComments.length === (fakeNewsTargets.length * 12),
                '8InFavorComments': inFavorComments.length === (fakeNewsTargets.length * 8),
                'AgainstComments3PlusUpvotes': againstCommentsWithUpvotes.length === againstComments.length,
                'CommentGroupsCreated': targetGroups.length > 0,
                'CommentFiltersCreated': targetFilters.length === recentComments.length,
                'ExpertVotingComplete': totalExpertVotes === (expertUsers.length * recentComments.length),
                'EvidenceLinksPresent': totalEvidenceLinks > 0
            };

            const passedRequirements = Object.values(requirements).filter(Boolean).length;
            const totalRequirements = Object.keys(requirements).length;

            console.log(`   ✅ Requirements passed: ${passedRequirements}/${totalRequirements}`);
            Object.entries(requirements).forEach(([req, passed]) => {
                console.log(`      ${passed ? '✅' : '❌'} ${req}`);
            });

            report.verification = {
                requirements: requirements,
                passedRequirements: passedRequirements,
                totalRequirements: totalRequirements,
                successRate: (passedRequirements / totalRequirements) * 100
            };

            // 9. Summary Statistics
            report.summary = {
                projectComplete: passedRequirements === totalRequirements,
                fakeNewsProcessed: fakeNewsTargets.length,
                totalCommentsCreated: recentComments.length,
                commentGroupsCreated: targetGroups.length,
                commentFiltersCreated: targetFilters.length,
                evidenceLinksAdded: totalEvidenceLinks,
                expertVotesRecorded: totalExpertVotes,
                successRate: `${((passedRequirements / totalRequirements) * 100).toFixed(1)}%`
            };

            // 10. Save Report
            const reportPath = path.join(__dirname, '..', 'comment-data', 'summary', 'final-verification-report.json');
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

            console.log('\n🎉 FINAL VERIFICATION REPORT COMPLETE!');
            console.log(`📊 Overall Success Rate: ${report.verification.successRate.toFixed(1)}%`);
            console.log(`📁 Report saved: final-verification-report.json`);

            return report;

        } catch (error) {
            console.error('❌ Error generating report:', error);
            return null;
        }
    }
}

// Execute if run directly
if (require.main === module) {
    async function main() {
        const reporter = new FinalVerificationReport();
        if (await reporter.initialize()) {
            const report = await reporter.generateCompleteReport();
            if (report && report.verification.successRate === 100) {
                console.log('\n🏆 PROJECT SUCCESSFULLY COMPLETED!');
                console.log('✅ All requirements have been met');
                console.log('✅ Database integration is complete');
                console.log('✅ JSON files have been exported');
                console.log('✅ Comment system is ready for frontend use');
            }
        }
        await mongoose.connection.close();
        console.log('📁 Database connection closed');
    }
    
    main().catch(console.error);
}

module.exports = FinalVerificationReport;