const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret_test';

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ error: "Accès refusé, token manquant" });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.proprietaireId = decoded.id;
    req.proprietaireEmail = decoded.email;

    next();
  } catch (err) {
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
};
