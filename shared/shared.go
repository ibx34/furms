package shared

import sq "github.com/Masterminds/squirrel"

var (
	UsingDollarSigns = sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
)
