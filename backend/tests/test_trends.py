from app.analytics.trends import _consecutive_direction, _is_accelerating


def test_accelerating_series():
    assert _is_accelerating([10000, 12000, 15000, 18000])
    assert not _is_accelerating([10000, 9000, 15000])


def test_consecutive_direction():
    assert _consecutive_direction([10, 12, 15, 18]) == "increasing"
    assert _consecutive_direction([18, 15, 12, 10]) == "decreasing"
    assert _consecutive_direction([10, 12, 11]) is None
