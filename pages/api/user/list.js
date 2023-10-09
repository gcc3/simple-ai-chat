import { getUsers } from 'utils/sqliteUtils.js';

export default async function (req, res) {
  // Method Not Allowed if not GET
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    const users = await getUsers();
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
