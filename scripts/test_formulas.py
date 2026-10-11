"""Tests unitaires formules BRVM Analyste."""
def rsi_wilder(vals, period=14):
    if len(vals) < period + 1:
        return None
    gains, losses = [], []
    for i in range(1, len(vals)):
        d = vals[i] - vals[i - 1]
        gains.append(d if d > 0 else 0)
        losses.append(-d if d < 0 else 0)
    avg_g = sum(gains[:period]) / period
    avg_l = sum(losses[:period]) / period
    for i in range(period, len(gains)):
        avg_g = (avg_g * (period - 1) + gains[i]) / period
        avg_l = (avg_l * (period - 1) + losses[i]) / period
    if avg_l == 0:
        return 100.0
    return 100 - 100 / (1 + avg_g / avg_l)

def per(price, eps):
    if price is None or eps is None or price <= 0 or eps <= 0:
        return None
    return price / eps

def growth(old, new):
    if old is None or new is None or old == 0:
        return None
    return 100 * (new - old) / abs(old)

def cmp(q1, c1, q2, c2):
    return (q1 * c1 + q2 * c2) / (q1 + q2)

def test_per():
    assert abs(per(10400, 700) - 10400 / 700) < 1e-9
    assert per(100, 0) is None
    assert per(None, 10) is None

def test_growth_negative():
    assert growth(100, 80) == -20

def test_cmp():
    assert abs(cmp(10, 1000, 10, 1200) - 1100) < 1e-9

def test_rsi():
    r = rsi_wilder(list(range(1, 20)))
    assert r is not None and 50 < r <= 100

def test_sell_pnl():
    cost, sell, qty, fee = 1000, 1200, 10, 50
    pnl = qty * (sell - cost) - fee
    assert pnl == 1950

if __name__ == "__main__":
    test_per()
    test_growth_negative()
    test_cmp()
    test_rsi()
    test_sell_pnl()
    print("OK all tests")
