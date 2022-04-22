import { referrerPolicy } from 'koa-helmet';

export default referrerPolicy({ policy: 'same-origin' });
