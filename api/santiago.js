export default function handler(req, res) {
  res.status(200).json({
    message: 'Hello from Santiago — backend is alive',
    method: req.method,
    timestamp: new Date().toISOString(),
  });
}