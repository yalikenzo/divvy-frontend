export class CreateGroupPayload {
  constructor(name, currency = 'USD') {
    this.name = name;
    this.currency = currency;
  }
}

export class UpdateGroupPayload {
  constructor(name, currency) {
    this.name = name;
    this.currency = currency;
  }
}


export class InviteToGroupPayload {
  constructor(email, groupId) {
    this.email = email;
    this.group_id = groupId;
  }
}

export class UserGroup {
  constructor(id, groupId, userId, groupRole, joinedAt) {
    this.id = id;
    this.group_id = groupId;
    this.user_id = userId;
    this.group_role = groupRole;
    this.joined_at = joinedAt;
  }

  static fromResponse(data) {
    return new UserGroup(
      data.id,
      data.group_id,
      data.user_id,
      data.group_role,
      data.joined_at
    );
  }
}

export class Group {
  constructor(
    id,
    name,
    creatorId,
    createdAt,
    isActive,
    currency,
    invitationLink
  ) {
    this.id = id;
    this.name = name;
    this.creator_id = creatorId;
    this.created_at = createdAt;
    this.is_active = isActive;
    this.currency = currency;
    this.invitation_link = invitationLink;
  }

  static fromResponse(data) {
    return new Group(
      data.id,
      data.name,
      data.creator_id,
      data.created_at,
      data.is_active,
      data.currency,
      data.invitation_link
    );
  }

  getCurrencySymbol() {
    const symbols = {
      USD: '$',
      EUR: '€',
      KZT: '₸',
      JPY: '¥',
      CNY: '¥',
      RUB: '₽',
    };
    return symbols[this.currency] || this.currency;
  }

  getFormattedDate() {
    const date = new Date(this.created_at);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
];



export class InviteUserPayload {
  constructor(email, groupId) {
    this.email = email;
    this.group_id = groupId;
  }
}

export class UserGroupRead {
  constructor(id, groupId, userId, groupRole, joinedAt) {
    this.id = id;
    this.group_id = groupId;
    this.user_id = userId;
    this.group_role = groupRole;
    this.joined_at = joinedAt;
  }

  static fromResponse(data) {
    return new UserGroupRead(
      data.id,
      data.group_id,
      data.user_id,
      data.group_role,
      data.joined_at
    );
  }
}
