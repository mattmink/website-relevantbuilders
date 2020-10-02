const routes = [
    {
        path: '/',
        component: () => import('./pages/home.js'),
    },
    {
        path: '/process',
        component: () => import('./pages/process/process.js'),
    },
    {
        path: '/process/design',
        component: () => import('./pages/process/design/design.js'),
    }
];

export default routes;
