export interface Review {
  id: string;
  tenantId: string;
  restaurantId: string;
  waiterId?: string;
  userInfo: UserInfo;
  rating: number;
  breakdown: {
    food: number;
    service: number;
    ambiance: number;
    music: number;
  };
  breakdownComments: {
    food: string;
    service: string;
    ambiance: string;
    music: string;
  };
  comment: string;
  contactInfo: string;
  category?: string;
  status: 'published' | 'pending_resolution' | 'resolved';
  timestamp: number;
}

export interface UserInfo {
  name: string;
  email: string;
  ageRange: string;
}

export interface Waiter {
  id: string;
  tenantId: string;
  name: string;
  active: boolean;
  dateAdded: number;
}

export interface Tenant {
  id: string;
  name: string;
  managerPin: string;
  googleReviewLink: string;
  active: boolean;
}

export type ViewState = 'landing' | 'saas_admin' | 'tenant_manager' | 'tenant_wizard';
