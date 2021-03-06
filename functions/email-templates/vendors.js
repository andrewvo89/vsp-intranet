const {
  wrapWithParagraph,
  wrapWithQuote,
  wrapWithTemplate,
  transformForEmail
} = require('../utils/html-helper');
const { format, utcToZonedTime } = require('date-fns-tz');
const { LONG_DATE_TIME } = require('../utils/date');
const User = require('../models/user');

module.exports.newVendor = async (notification, sender) => {
  const { emailData, recipient: notificationRecipient } = notification;
  const { vendorId, name, createdAt } = emailData;
  const senderFullName = sender.getFullName();
  const recipient = new User({ ...notificationRecipient });
  const timezone = await recipient.getTimezone();
  const zonedDate = utcToZonedTime(createdAt, timezone);
  const createdByFormatted = format(zonedDate, LONG_DATE_TIME, {
    timeZone: timezone
  });

  const html = [
    wrapWithParagraph(
      `${senderFullName} created a new Vendor named "${name}".`
    ),
    wrapWithQuote(`
      Vendor ID: ${vendorId}<br/>
			Created at: ${createdByFormatted}<br/>
			Created by: ${senderFullName}
		`)
  ];
  const templateHtml = wrapWithTemplate(html.join('\n'), recipient);
  const transformedHtml = transformForEmail(templateHtml);
  return transformedHtml;
};
