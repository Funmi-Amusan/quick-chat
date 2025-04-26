import {
  formatTimestampToDay,
  formatTimestamp,
  formatTimestampToTimeOrDate,
  formatMomentAgo,
  isSameDay,
} from '../helpers';

describe('helpers', () => {
  describe('formatTimestamp', () => {
    it('formats timestamp correctly', () => {
      const timestamp = 1619715600000;
      expect(formatTimestamp(timestamp)).toBe('6:00pm');
    });
  });

  describe('formatTimestampToDay', () => {
    const MockDate = new Date('2025-04-24T17:22:00Z');

    beforeAll(() => {
      jest.useFakeTimers(); // allows time control in the test suite
      jest.setSystemTime(MockDate); // sets the time of the system to MockDate declared above
    });

    afterAll(() => {
      jest.useRealTimers(); // restore all timers
    });

    it('formats timestamp from earlier today correctly', () => {
      const timestamp = new Date('2025-04-24T10:30:00Z').getTime();
      expect(formatTimestampToDay(timestamp)).toBe('Today');
    });
    it('formats timestamp from later today correctly', () => {
      const timestamp = new Date('2025-04-24T16:30:00Z').getTime();
      expect(formatTimestampToDay(timestamp)).toBe('Today');
    });
    it('formats timestamp from yesterday correctly', () => {
      const timestamp = new Date('2025-04-23T12:30:00Z').getTime();
      expect(formatTimestampToDay(timestamp)).toBe('Yesterday');
    });
    it('formats timestamp from days ago correctly', () => {
      const timestamp = new Date('2025-04-20T12:30:00Z').getTime();
      expect(formatTimestampToDay(timestamp)).toBe('Sunday');
    });
    it('formats timestamp from last week correctly', () => {
      const timestamp = new Date('2025-04-16T12:30:00Z').getTime();
      expect(formatTimestampToDay(timestamp)).toBe('Wed, Apr 16');
    });
    it('formats timestamp from weeks ago correctly', () => {
      const timestamp = new Date('2025-03-04T12:30:00Z').getTime();
      expect(formatTimestampToDay(timestamp)).toBe('Tue, Mar 4');
    });
    it('formats timestamp from farther correctly', () => {
      const timestamp = new Date('2025-01-04T12:30:00Z').getTime();
      expect(formatTimestampToDay(timestamp)).toBe('Sat, Jan 4');
    });
  });

  describe('formatMomentAgo', () => {
    const MockDate = new Date('2025-04-24T17:22:00Z');

    beforeAll(() => {
      jest.useFakeTimers(); // allows time control in the test suite
      jest.setSystemTime(MockDate); // sets the time of the system to MockDate declared above
    });

    afterAll(() => {
      jest.useRealTimers(); // restore all timers
    });

    it('formats timestamp from right now correctly', () => {
      const timestamp = new Date('2025-04-24T17:22:00Z').getTime();
      expect(formatMomentAgo(timestamp)).toBe('just now');
    });
    it('formats timestamp from a couple mins ago correctly', () => {
      const timestamp = new Date('2025-04-24T17:02:00Z').getTime();
      expect(formatMomentAgo(timestamp)).toBe('20m ago');
    });
    it('formats timestamp from a couple hours ago correctly', () => {
      const timestamp = new Date('2025-04-24T14:22:00Z').getTime();
      expect(formatMomentAgo(timestamp)).toBe('3h ago');
    });
    it('formats timestamp from days ago correctly', () => {
      const timestamp = new Date('2025-04-21T12:30:00Z').getTime();
      expect(formatMomentAgo(timestamp)).toBe('3d ago');
    });
    it('formats timestamp from last week correctly', () => {
      const timestamp = new Date('2025-04-17T12:30:00Z').getTime();
      expect(formatMomentAgo(timestamp)).toBe('1w ago');
    });
    it('formats timestamp from last week correctly', () => {
      const timestamp = new Date('2025-04-09T12:30:00Z').getTime();
      expect(formatMomentAgo(timestamp)).toBe('2w ago');
    });
    it('formats timestamp from a month ago correctly', () => {
      const timestamp = new Date('2025-03-24T12:30:00Z').getTime();
      expect(formatMomentAgo(timestamp)).toBe('1mo ago');
    });
    it('formats timestamp from months ago correctly', () => {
      const timestamp = new Date('2025-01-04T12:30:00Z').getTime();
      expect(formatMomentAgo(timestamp)).toBe('3mo ago');
    });
    it('formats timestamp from years ago correctly', () => {
      const timestamp = new Date('2023-01-04T12:30:00Z').getTime();
      expect(formatMomentAgo(timestamp)).toBe('2y ago');
    });
  });

  describe('formatTimestampToTimeOrDate', () => {
    const MockDate = new Date('2025-04-24T17:22:00Z');

    beforeAll(() => {
      jest.useFakeTimers(); // allows time control in the test suite
      jest.setSystemTime(MockDate); // sets the time of the system to MockDate declared above
    });

    afterAll(() => {
      jest.useRealTimers(); // restore all timers
    });

    it('formats timestamp from earlier today correctly', () => {
      const timestamp = new Date('2025-04-24T10:30:00Z').getTime();
      expect(formatTimestampToTimeOrDate(timestamp)).toBe('11:30AM');
    });
    it('formats timestamp from later today correctly', () => {
      const timestamp = new Date('2025-04-24T16:30:00Z').getTime();
      expect(formatTimestampToTimeOrDate(timestamp)).toBe('5:30PM');
    });
    it('formats timestamp from yesterday correctly', () => {
      const timestamp = new Date('2025-04-23T12:30:00Z').getTime();
      expect(formatTimestampToTimeOrDate(timestamp)).toBe('Yesterday');
    });
    it('formats timestamp from days ago correctly', () => {
      const timestamp = new Date('2025-04-20T12:30:00Z').getTime();
      expect(formatTimestampToTimeOrDate(timestamp)).toBe('20/04/25');
    });
    it('formats timestamp from last week correctly', () => {
      const timestamp = new Date('2025-04-16T12:30:00Z').getTime();
      expect(formatTimestampToTimeOrDate(timestamp)).toBe('16/04/25');
    });
    it('formats timestamp from weeks ago correctly', () => {
      const timestamp = new Date('2025-03-04T12:30:00Z').getTime();
      expect(formatTimestampToTimeOrDate(timestamp)).toBe('04/03/25');
    });
    it('formats timestamp from farther correctly', () => {
      const timestamp = new Date('2025-01-04T12:30:00Z').getTime();
      expect(formatTimestampToTimeOrDate(timestamp)).toBe('04/01/25');
    });
  });

  describe('isSameDay', () => {
    it('formats timestamp from earlier today correctly', () => {
      const timestamp1 = new Date('2025-04-24T10:30:00Z').getTime();
      const timestamp2 = new Date('2025-04-24T20:30:00Z').getTime();
      expect(isSameDay(timestamp1, timestamp2)).toBeTruthy();
    });
    it('formats timestamp from later today correctly', () => {
      const timestamp1 = new Date('2025-04-24T01:00:00Z').getTime();
      const timestamp2 = new Date('2025-04-24T20:00:00Z').getTime();
      expect(isSameDay(timestamp1, timestamp2)).toBeTruthy();
    });
  });
});