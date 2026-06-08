import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'login'
	},
	{
		path: 'login',
		loadComponent: () => import('./pages/static-page/static-page').then((m) => m.StaticPageComponent),
		data: {
			pageUrl: '/pages/login.html',
			title: 'Login'
		}
	},
	{
		path: 'login.html',
		redirectTo: 'login'
	},
	{
		path: 'registration',
		loadComponent: () => import('./pages/static-page/static-page').then((m) => m.StaticPageComponent),
		data: {
			pageUrl: '/pages/registration-form.html',
			title: 'Registration'
		}
	},
	{
		path: 'registration-form.html',
		redirectTo: 'registration'
	},
	{
		path: 'customer-dashboard',
		loadComponent: () => import('./pages/static-page/static-page').then((m) => m.StaticPageComponent),
		data: {
			pageUrl: '/pages/customer/customer-dashboard-edge.html',
			title: 'Customer Dashboard'
		}
	},
	{
		path: 'customer-dashboard.html',
		redirectTo: 'customer-dashboard'
	},
	{
		path: 'support-dashboard',
		loadComponent: () => import('./pages/static-page/static-page').then((m) => m.StaticPageComponent),
		data: {
			pageUrl: '/pages/support/support-dashboard-edge.html',
			title: 'Support Dashboard'
		}
	},
	{
		path: 'support-dashboard.html',
		redirectTo: 'support-dashboard'
	},
	{
		path: '**',
		redirectTo: 'login'
	}
];
