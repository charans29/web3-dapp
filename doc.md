# Project Documentation

## Steps Followed From Scratch

# WEB2.0 bits

### Initial Setup

1. Initialized an empty TypeScript project in the `backend` folder by running the following command:

    npm init -y

    to creat a `package.json`

2. Then To configure TypeScript for the project, I installed TypeScript as a development dependency:
    
    npm install typescript --save-dev

3. Created a tsconfig.json file to define the compiler options:

    npx tsc --init

4. In tsconfig.json specified "outDir": "./dist" & "rootDir": "./src".

### App Setup

5. index.ts needs express, so installed `npm install express @types/express`
  
6. Intialized AWS EC2 instance, S3 scalable cloud storage (bucket setup) and cloudfront CDN 

7. Initialized (next app) user & worker frontends `прх create-next-app`

8. Designed schema using postgres(DB) & prisma(ORM) by installing `npm i prisma` under bsckend and then initialised `npx prisma init` to set up Prisma ORM(by writing tables) and then migrated to postgres `npx prisma migrate dev`
9. Added endpoints for User and Worker routes and for sso installing JWT `npm i jsonwebtoken` later `npm i --save-dev @types/jsonwebtoken` to prevent type error
10. to compile code `tsc -b` & to run `node dist/index.js` and tested through postman.

### Getting PresignedURL's 

#### (Generate presigned URL's nodejs s3)

11. through `npm i @aws-sdk/client-s3` as well as `npm i @aws-sdk/s3-presigned-post` and this endpoint making through authmiddleware to identofy user
12. make sure of created IAM user to be assigned to one of the security groups that are related to buckets.
13. Added `npm i zod` after making changes in index.ts to parse data that user send to bakcend through body [basically to validate input send by user].
13. re migrated schema as removed option_id from options `npx prisma migrate dev --name emove_option_id` and regenerate client through `npx prisma generate`.
14. tested task end point(post) with json on postman
    {
        options: [
            { imgUrl: 'asd' },
            { imgUrl: 'Fandom_image_url' },
            { imgUrl: 'random_image_url' }
        ],
        signature: '0x123123123'
    }
15. tested task(get) endpoint http://localhost:3000/v1/user/task?taskId=1
16. creting endpoints to worker and removed bal_id from worker schema and migrated `npx prisma migrate dev --name remove_balid_worker` then generated `npx prisma generate `.
17. Again modified Task schema by altering it with done col, so migrate and generate.
18. once again `npx prisma migrate dev --name added_unique_constraint` and regenerate.
