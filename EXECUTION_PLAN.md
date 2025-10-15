/*
=================================================================
COMPREHENSIVE FAKE NEWS COMMENTS SYSTEM - EXECUTION PLAN
=================================================================

CURRENT SITUATION ANALYSIS:
✅ Database contains data (300 comments, 180 groups, 158 filters)
✅ Target news articles exist (5 fake news with 20 comments each)
✅ Users exist (14 community, 6 expert)
❌ Data might not be structured exactly per requirements
❌ JSON files may not be properly organized

REQUIREMENTS REVIEW:
1. ✅ 20 comments per fake news article
2. ✅ 12 against comments, 8 in favor per article  
3. ✅ 12 comment groups per article (similar comments grouped)
4. ✅ All comments by community users randomly
5. ❌ ALL 6 expert users must vote on EVERY comment
6. ❌ Against comments must have 3+ upvotes with descriptions
7. ✅ Every comment has supporting evidence links with descriptions
8. ❌ Store in JSON files (separate per news article, organized folder)
9. ✅ Comment groups in DB with comment _ids
10. ✅ Comment filters for every comment in DB
11. ✅ Follow database schema exactly

EXECUTION PLAN:

PHASE 1: DATA CLEANUP & PREPARATION
- Clear existing fake news comments to start fresh
- Verify target news articles exist
- Verify users exist (community & expert)

PHASE 2: COMMENT GENERATION
- Generate exactly 20 comments per fake news (12 against, 8 favor)
- Assign random community users
- Add 2-3 evidence links per comment with descriptions
- Ensure against comments will get 3+ upvotes

PHASE 3: EXPERT VOTING SYSTEM
- ALL 6 expert users vote on EVERY comment (600 total votes)
- Against comments get 3+ upvotes guaranteed
- Each vote includes detailed explanation
- Calculate scores (upvotes - downvotes)

PHASE 4: COMMENT GROUPING
- Create exactly 12 groups per news article
- Group similar comments by sentiment/topic
- Ensure proper distribution across groups

PHASE 5: DATABASE INTEGRATION
- Insert comments with complete schema compliance
- Create comment groups with embedded comment IDs
- Generate comment filters linking comments to groups
- Verify all relationships

PHASE 6: JSON EXPORT SYSTEM
- Create organized folder structure
- Export individual files per news article:
  * news-{id}-comments.json
  * news-{id}-groups.json  
  * news-{id}-filters.json
  * news-{id}-summary.json
- Generate master summary file

PHASE 7: VERIFICATION & VALIDATION
- Verify all requirements met
- Check data integrity
- Generate compliance report
- Provide access instructions

TARGET FAKE NEWS ARTICLES:
1. 68ef91ef3bda87128d26e22c - "Proof The Mainstream Media Is Manipulating..."
2. 68ef91ef3bda87128d26e22e - "Charity: Clinton Foundation Distributed..."  
3. 68ef91ef3bda87128d26e232 - "A Hillary Clinton Administration May be..."
4. 68ef91ef3bda87128d26e234 - "Trump's Latest Campaign Promise May Be..."
5. 68ef91ef3bda87128d26e238 - "Obama Pushes One World Government..."

EXPECTED DELIVERABLES:
- 100 comments (20 per news × 5 articles)
- 600 expert votes (6 experts × 100 comments)
- 300+ evidence links (3 per comment average)
- 60 comment groups (12 per news × 5 articles)
- 100 comment filters (1 per comment)
- 20 JSON files (4 types × 5 articles)
- 1 master summary file

QUALITY ASSURANCE:
- All against comments have 3+ upvotes ✓
- All comments have evidence links ✓
- All expert votes include explanations ✓
- All data follows schema exactly ✓
- All files properly organized ✓

EXECUTION TIME: ~30 minutes
SUCCESS CRITERIA: 100% compliance with all requirements
*/